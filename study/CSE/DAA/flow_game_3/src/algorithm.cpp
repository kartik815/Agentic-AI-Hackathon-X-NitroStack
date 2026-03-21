// algorithm.cpp — Flow Game Solver
// Warnsdorff heuristic + path elongation. No time budgets, no DFS backtracking.

#include "algorithm.h"
#include <algorithm>
#include <chrono>
#include <cstdint>
#include <iostream>
#include <queue>
#include <random>
#include <unordered_map>
#include <vector>
using namespace std;

// ── Globals ───────────────────────────────────────
vector<Mask>       neighborMask;
Mask               terminalMask = 0;
vector<SolveEvent> solveEvents;

static bool              g_solverDone = true;
static int               rows, cols, numColors;
static vector<Mask>      colorMasks;
static Mask              filledMask;
static vector<Mask>      bestMasks;
static int               bestScore = -1;
static vector<vector<int>> colorPaths;

// ── Geometry ──────────────────────────────────────
static inline int ci(int r, int c) { return r * cols + c; }
static Mask boardMask() { int n=rows*cols; return n<64?(1ULL<<n)-1ULL:~0ULL; }

static void computeNeighbors() {
    neighborMask.assign(rows*cols, 0);
    for (int r=0;r<rows;r++) for (int c=0;c<cols;c++) {
        int idx=ci(r,c); Mask m=0;
        if(r>0)      m|=1ULL<<ci(r-1,c);
        if(r<rows-1) m|=1ULL<<ci(r+1,c);
        if(c>0)      m|=1ULL<<ci(r,c-1);
        if(c<cols-1) m|=1ULL<<ci(r,c+1);
        neighborMask[idx]=m;
    }
}

// ── BFS ───────────────────────────────────────────
static vector<int> bfsPath(int start, int goal, Mask avail) {
    if(start==goal) return {start};
    vector<int> par(rows*cols,-1); par[start]=start;
    Mask seen=1ULL<<start; queue<int> q; q.push(start);
    while(!q.empty()) {
        int cur=q.front();q.pop();
        Mask adj=neighborMask[cur]&avail&~seen;
        while(adj){ int nxt=__builtin_ctzll(adj);adj&=adj-1;
            seen|=1ULL<<nxt; par[nxt]=cur;
            if(nxt==goal){
                vector<int> p; for(int x=goal;x!=start;x=par[x])p.push_back(x);
                p.push_back(start); reverse(p.begin(),p.end()); return p;
            } q.push(nxt);
        }
    }
    return {};
}

// ── BFS reachability check ────────────────────────
static bool canReach(int start, int goal, Mask avail, Mask visited) {
    if(start==goal) return true;
    if(!((avail>>start)&1) || !((avail>>goal)&1)) return false;
    Mask seen=1ULL<<start|visited, front=1ULL<<start;
    while(front) {
        int cur=__builtin_ctzll(front); front&=front-1;
        if(cur==goal) return true;
        Mask adj=neighborMask[cur]&avail&~seen;
        seen|=adj; front|=adj;
    }
    return false;
}

// ── Warnsdorff path ───────────────────────────────
// Move to neighbor with fewest onward free moves (most constrained first).
// Skip moves that disconnect us from the goal.
// Deprioritise goal until it's the only safe option.
static vector<int> warnsdorffPath(int start, int goal, Mask avail) {
    vector<int> path; path.reserve(rows*cols);
    path.push_back(start);
    Mask visited = 1ULL<<start;

    for(int iter=0; iter<rows*cols*2; iter++) {
        if(path.back()==goal) break;
        int cur = path.back();
        // Never step on goal mid-path — only as a deliberate final step.
        // This prevents the path from routing THROUGH the goal terminal and continuing.
        Mask adjMask = neighborMask[cur] & avail & ~visited & ~(1ULL<<goal);
        
        // Check if goal is directly adjacent (we may need to take it)
        bool goalAdjacent = (neighborMask[cur] & (1ULL<<goal) & ~visited) != 0;

        if(!adjMask) {
            // No non-goal moves — take goal if adjacent, else stuck
            if(goalAdjacent) { path.push_back(goal); visited|=1ULL<<goal; }
            break;
        }

        // Collect candidates that still allow reaching goal
        vector<int> safe;
        for(Mask a=adjMask;a;a&=a-1) {
            int n=__builtin_ctzll(a);
            if(canReach(n, goal, avail, visited|(1ULL<<n)))
                safe.push_back(n);
        }
        if(safe.empty()) {
            // No safe non-goal move — take goal if adjacent
            if(goalAdjacent) { path.push_back(goal); visited|=1ULL<<goal; }
            break;
        }

        // If only the goal is safe, take it
        if(safe.size()==1 && safe[0]==goal) {
            path.push_back(goal); visited|=1ULL<<goal; break;
        }

        // Warnsdorff score: fewest onward moves wins; goal always last
        auto score = [&](int n) -> int {
            if(n==goal) return 10000;
            // Count onward moves (excluding goal to avoid premature termination)
            Mask onward = neighborMask[n] & avail & ~visited & ~(1ULL<<n) & ~(1ULL<<goal);
            int cnt = __builtin_popcountll(onward);
            // Dead-end: no onward moves → deprioritise to just below goal.
            // Picking a dead end forces immediate goal-taking next step, cutting path short.
            return (cnt > 0) ? cnt : 9999;
        };
        sort(safe.begin(), safe.end(), [&](int a, int b){ return score(a)<score(b); });
        int chosen = safe[0];
        path.push_back(chosen); visited|=1ULL<<chosen;
    }
    return (path.back()==goal) ? path : vector<int>{};
}

// ── Path elongation ───────────────────────────────
// Op1: Simple insert — F adjacent to consecutive pair (path[i], path[i+1])
// Op2: Reroute — F adjacent to non-consecutive path[li] and path[lj],
//      producing path[0..li] + F + reverse(path[li+1..lj]) + path[lj+1..]
static bool elongateOnce(int color) {
    vector<int> &path = colorPaths[color];
    int n = (int)path.size();
    Mask free = (~filledMask) & boardMask();
    if(!free) return false;

    vector<int> pos(rows*cols, -1);
    for(int i=0;i<n;i++) pos[path[i]]=i;

    // Op1: simple insert
    for(int i=0;i<n-1;i++) {
        Mask fn = neighborMask[path[i]] & free;
        while(fn) {
            int F=__builtin_ctzll(fn); fn&=fn-1;
            if(neighborMask[path[i+1]] & (1ULL<<F)) {
                path.insert(path.begin()+i+1, F);
                colorMasks[color]|=1ULL<<F; filledMask|=1ULL<<F;
                return true;
            }
        }
    }

    // Op2: reroute
    for(int i=0;i<n;i++) {
        Mask fn = neighborMask[path[i]] & free;
        while(fn) {
            int F=__builtin_ctzll(fn); fn&=fn-1;
            Mask pn = neighborMask[F] & colorMasks[color];
            while(pn) {
                int pj=__builtin_ctzll(pn); pn&=pn-1;
                int j=pos[pj]; if(j<0||j==i||j==i+1||j==i-1) continue;
                int li=min(i,j), lj=max(i,j);
                // Never reroute a segment that includes an endpoint terminal.
                // If lj==n-1, reversing would move the end terminal to the interior.
                if(lj >= n-1) continue;
                if(!(neighborMask[path[li]]&(1ULL<<F))) continue;
                if(!(neighborMask[path[lj]]&(1ULL<<F))) continue;
                if(lj+1<n && !(neighborMask[path[li+1]]&(1ULL<<path[lj+1]))) continue;
                vector<int> np; np.reserve(n+1);
                for(int k=0;k<=li;k++) np.push_back(path[k]);
                np.push_back(F);
                for(int k=lj;k>li;k--) np.push_back(path[k]);
                for(int k=lj+1;k<n;k++) np.push_back(path[k]);
                colorMasks[color]|=1ULL<<F; filledMask|=1ULL<<F;
                path=move(np); return true;
            }
        }
    }
    return false;
}

static void elongateAll() {
    bool any=true;
    while(any) { any=false;
        for(int c=1;c<=numColors;c++)
            if(!colorPaths[c].empty())
                while(elongateOnce(c)) any=true;
    }
}

// ── Board <-> masks ───────────────────────────────
static void boardToMasks(const Board &board) {
    rows=cols=board.N; numColors=0; terminalMask=0;
    for(int r=0;r<rows;r++) for(int c=0;c<cols;c++) {
        numColors=max(numColors,board.board[r][c].color);
        if(board.board[r][c].isTerminal) terminalMask|=1ULL<<ci(r,c);
    }
    colorMasks.assign(numColors+1,0); filledMask=0;
    for(int r=0;r<rows;r++) for(int c=0;c<cols;c++) {
        const Cell &cell=board.board[r][c];
        if(!cell.color) continue;
        Mask bit=1ULL<<ci(r,c);
        colorMasks[cell.color]|=bit; filledMask|=bit;
    }
}

static void masksToBoard(Board &board) {
    for(int r=0;r<rows;r++) for(int c=0;c<cols;c++) {
        board.board[r][c].hasPipe=false;
        if(!board.board[r][c].isTerminal) board.board[r][c].color=0;
    }
    for(int color=1;color<=numColors;color++)
        for(int idx:colorPaths[color]) {
            board.board[idx/cols][idx%cols].color=color;
            board.board[idx/cols][idx%cols].hasPipe=true;
        }
}

// ── Animation events ──────────────────────────────
// Emit one place-event per non-terminal cell in path order.
// No remove events — board is wiped before replay starts.
static void buildAnimationEvents() {
    solveEvents.clear();
    for(int color=1;color<=numColors;color++)
        for(int idx:colorPaths[color])
            if(!(terminalMask&(1ULL<<idx)))
                solveEvents.push_back({idx,color,true});
}

// ── Solve one color ───────────────────────────────
static void solveColor(int color) {
    Mask terms=colorMasks[color]&terminalMask;
    if(__builtin_popcountll(terms)!=2) return;
    int t1=__builtin_ctzll(terms);
    int t2=__builtin_ctzll(terms&(terms-1));
    Mask avail=((~filledMask)&boardMask())|colorMasks[color];

    // Try both directions, keep longer
    vector<int> p1=warnsdorffPath(t1,t2,avail);
    vector<int> p2=warnsdorffPath(t2,t1,avail);
    if(!p2.empty()) reverse(p2.begin(),p2.end());

    vector<int> best;
    if(!p1.empty()&&!p2.empty()) best=(p1.size()>=p2.size())?p1:p2;
    else if(!p1.empty()) best=p1;
    else if(!p2.empty()) best=p2;

    if(best.empty()) { best=bfsPath(t1,t2,avail); }
    if(best.empty()) { cerr<<"Cannot connect color "<<color<<"\n"; return; }

    colorMasks[color]=0;
    for(int idx:best) colorMasks[color]|=1ULL<<idx;
    filledMask=0; for(int c=1;c<=numColors;c++) filledMask|=colorMasks[c];
    colorPaths[color]=move(best);
}

// ── Public API ────────────────────────────────────
void solveBoard(Board &board) {
    cout<<"Solver started\n";
    g_solverDone=false;
    boardToMasks(board); computeNeighbors();
    for(int c=1;c<=numColors;c++) colorMasks[c]&=terminalMask;
    filledMask=0; for(int c=1;c<=numColors;c++) filledMask|=colorMasks[c];
    colorPaths.assign(numColors+1,{});
    bestScore=-1;

    // Sort by terminal distance descending (hardest pairs first)
    struct CP { int color,t1,t2,dist; };
    vector<CP> pairs;
    for(int c=1;c<=numColors;c++) {
        Mask terms=colorMasks[c]&terminalMask;
        if(__builtin_popcountll(terms)!=2) continue;
        int t1=__builtin_ctzll(terms), t2=__builtin_ctzll(terms&(terms-1));
        pairs.push_back({c,t1,t2,abs(t1/cols-t2/cols)+abs(t1%cols-t2%cols)});
    }
    sort(pairs.begin(),pairs.end(),[](const CP&a,const CP&b){return a.dist<b.dist;}); // closest terminals first — lets short colors grab nearby cells before long-range colors

    cout<<"Phase 1: Warnsdorff connect\n";
    for(auto&p:pairs) {
        solveColor(p.color);
        cout<<"  color "<<p.color<<": "<<colorPaths[p.color].size()
            <<" cells, total="<<__builtin_popcountll(filledMask)<<"/"<<rows*cols<<"\n";
    }

    cout<<"Phase 2: Elongation\n";
    elongateAll();

    int filled=__builtin_popcountll(filledMask);
    cout<<"Done: "<<filled<<"/"<<rows*cols<<" cells\n";
    bestScore=filled; bestMasks=colorMasks;
    buildAnimationEvents();
    cout<<"Events: "<<solveEvents.size()<<"\n";
    g_solverDone=true;
}

bool solverFinished() { return g_solverDone; }

void applyBestToBoard(Board &board) {
    if(bestScore<0){cout<<"No solution\n";return;}
    masksToBoard(board); rebuildPaths(board);
}

void rebuildPaths(Board &board) {
    board.saved_paths.clear();
    for(int color=1;color<=numColors;color++) {
        if(colorPaths[color].empty()) continue;
        vector<pair<int,int>> path;
        for(int idx:colorPaths[color]) path.push_back({idx/cols,idx%cols});
        board.saved_paths.push_back(path);
    }
}

// ── A* (called each frame from main) ─────────────
static int manhattan(int r1,int c1,int r2,int c2){return abs(r1-r2)+abs(c1-c2);}

static bool terminalsReachable(const Board &b,int sr,int sc,int er,int ec) {
    int N=GRID; vector<vector<bool>> vis(N,vector<bool>(N,false));
    queue<pair<int,int>> q; q.push({sr,sc}); vis[sr][sc]=true;
    int dr[4]={-1,0,0,1},dc[4]={0,-1,1,0};
    while(!q.empty()){auto[r,c]=q.front();q.pop();
        if(r==er&&c==ec)return true;
        for(int k=0;k<4;k++){int nr=r+dr[k],nc=c+dc[k];
            if(nr<0||nc<0||nr>=N||nc>=N||vis[nr][nc])continue;
            if(b.board[nr][nc].hasPipe)continue;
            vis[nr][nc]=true;q.push({nr,nc});}}
    return false;
}

vector<vector<int>> getTerminals(const Board &board) {
    unordered_map<int,vector<pair<int,int>>> groups;
    for(int r=0;r<GRID;r++)for(int c=0;c<GRID;c++){
        int col=board.board[r][c].color;
        if(col&&board.board[r][c].isTerminal&&!board.board[r][c].hasPipe)
            groups[col].push_back({r,c});}
    vector<vector<int>> res;
    for(auto&[color,pts]:groups){if(pts.size()!=2)continue;
        auto[r1,c1]=pts[0];auto[r2,c2]=pts[1];
        if(terminalsReachable(board,r1,c1,r2,c2)){
            res.push_back({color,r1,c1});res.push_back({color,r2,c2});}}
    return res;
}

vector<pair<int,int>> getNeighbors(int color,int row,int col,
    const Board &board,const vector<vector<bool>>&visited) {
    vector<pair<int,int>> v; int N=GRID,dr[4]={-1,0,0,1},dc[4]={0,-1,1,0};
    for(int k=0;k<4;k++){int nr=row+dr[k],nc=col+dc[k];
        if(nr<0||nc<0||nr>=N||nc>=N)continue;
        if(visited[nr][nc])continue; if(board.board[nr][nc].hasPipe)continue;
        if(board.board[nr][nc].isTerminal&&board.board[nr][nc].color!=color)continue;
        v.push_back({nr,nc});}
    return v;
}

vector<pair<int,int>> reconstructPath(int er,int ec,
    const vector<vector<pair<int,int>>>&parents) {
    vector<pair<int,int>> path; int r=er,c=ec;
    while(r!=-1&&c!=-1){path.push_back({r,c});auto p=parents[r][c];r=p.first;c=p.second;}
    reverse(path.begin(),path.end()); return path;
}

struct ANode{int r,c,g,f,pr,pc,dir;};
struct AComp{bool operator()(const ANode&a,const ANode&b)const{return a.f!=b.f?a.f>b.f:a.g<b.g;}};

static vector<pair<int,int>> AStarForPair(const Board&board,pair<int,int>start,pair<int,int>goal) {
    int N=GRID,sr=start.first,sc=start.second,tr=goal.first,tc=goal.second;
    int color=board.board[sr][sc].color; const int S=100;
    vector<vector<int>> bestG(N,vector<int>(N,INT_MAX));
    vector<vector<pair<int,int>>> parent(N,vector<pair<int,int>>(N,{-1,-1}));
    priority_queue<ANode,vector<ANode>,AComp> pq;
    pq.push({sr,sc,0,manhattan(sr,sc,tr,tc)*S,-1,-1,0}); bestG[sr][sc]=0;
    int dr[4]={-1,0,0,1},dc[4]={0,-1,1,0};
    while(!pq.empty()){ANode cur=pq.top();pq.pop();int r=cur.r,c=cur.c;
        if(cur.g!=bestG[r][c])continue;
        if(r==tr&&c==tc){vector<pair<int,int>> path;int cr=r,cc=c;
            while(!(cr==-1&&cc==-1)){path.push_back({cr,cc});
                auto p=parent[cr][cc];if(p.first==-1&&p.second==-1)break;cr=p.first;cc=p.second;}
            reverse(path.begin(),path.end());return path;}
        for(int k=0;k<4;k++){int nr=r+dr[k],nc=c+dc[k];
            if(nr<0||nc<0||nr>=N||nc>=N)continue;
            if(board.board[nr][nc].hasPipe&&!(nr==tr&&nc==tc))continue;
            if(board.board[nr][nc].isTerminal&&board.board[nr][nc].color!=color&&!(nr==tr&&nc==tc))continue;
            int ng=cur.g+S,nh=manhattan(nr,nc,tr,tc)*S;
            int bias=(cur.dir&&cur.dir==k+1)?-20:0;
            if(nr==0||nc==0||nr==N-1||nc==N-1)bias-=10;
            if(ng<bestG[nr][nc]){bestG[nr][nc]=ng;parent[nr][nc]={r,c};
                pq.push({nr,nc,ng,ng+nh+bias,r,c,k+1});}}}
    return {};
}

static int pairDiff(const Board&b,pair<int,int>a,pair<int,int>bp) {
    int base=manhattan(a.first,a.second,bp.first,bp.second)*100;
    int dr[4]={-1,0,0,1},dc[4]={0,-1,1,0},fr=0;
    for(int i=0;i<4;i++){int r=a.first+dr[i],c=a.second+dc[i];
        if(r>=0&&c>=0&&r<GRID&&c<GRID&&!b.board[r][c].hasPipe)fr++;
        r=bp.first+dr[i];c=bp.second+dc[i];
        if(r>=0&&c>=0&&r<GRID&&c<GRID&&!b.board[r][c].hasPipe)fr++;}
    return base-fr*10;
}

vector<pair<int,int>> algorithm(const Board &board) {
    vector<vector<int>> terms=getTerminals(board);
    if(terms.empty())return{};
    unordered_map<int,vector<pair<int,int>>> groups;
    for(auto&t:terms)groups[t[0]].push_back({t[1],t[2]});
    struct Cand{int color;pair<int,int>a,b;int diff;};
    vector<Cand> cand;
    for(auto&[color,pts]:groups){if(pts.size()!=2)continue;
        cand.push_back({color,pts[0],pts[1],pairDiff(board,pts[0],pts[1])});}
    if(cand.empty())return{};
    sort(cand.begin(),cand.end(),[](const Cand&x,const Cand&y){return x.diff<y.diff;});
    for(auto&c:cand){auto p1=AStarForPair(board,c.a,c.b),p2=AStarForPair(board,c.b,c.a);
        vector<pair<int,int>> chosen;
        if(!p1.empty()&&!p2.empty())chosen=(p1.size()<=p2.size())?p1:p2;
        else if(!p1.empty())chosen=p1;else if(!p2.empty())chosen=p2;
        if(!chosen.empty())return chosen;}
    return{};
}

int randomInt(int ub){static mt19937 rng(42);return uniform_int_distribution<int>(0,ub-1)(rng);}
bool colorAlreadyAdded(int color,vector<vector<int>> colors){
    for(auto&v:colors)if(!v.empty()&&v[0]==color)return true;return false;}