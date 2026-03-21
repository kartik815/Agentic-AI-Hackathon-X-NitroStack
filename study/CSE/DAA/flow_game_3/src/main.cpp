#include "board.h"
#include "algorithm.h"
#include "globals.h"
#include "raylib.h"
#include <utility>
#include <vector>
#include <queue>
#include <algorithm>
#include <set>

int GRID_OFFSET_X = 0;
int GRID_OFFSET_Y = 0;

enum GamePhase { ASTAR_PHASE, ASTAR_DONE, EXPANDING, EXPANSION_DONE };
GamePhase phase = ASTAR_PHASE;
int eventIndex = 0;
int eventsPerFrame = 5;

std::unordered_map<int, Color> color_map = {
    {1, Color{255, 0, 0, 255}},
    {2, Color{0, 255, 0, 255}},
    {3, Color{0, 0, 255, 255}},
    {4, Color{255, 165, 0, 255}},
    {5, Color{255, 0, 255, 255}},
    {6, Color{0, 255, 255, 255}},
    {7, Color{255, 255, 0, 255}},
    {8, Color{112, 55, 67, 255}},
    {9, Color{228, 123, 126, 255}},
    {10, Color{230, 143, 174, 255}}
};

std::vector<std::string> getLevelFiles(const std::string &folderPath) {
    std::vector<std::string> files;
    for (const auto &entry : std::filesystem::directory_iterator(folderPath))
        if (entry.is_regular_file())
            files.push_back(entry.path().string());
    return files;
}

int GRID = -1;
int CELL_SIZE = 80;
int PADDING = 60;

int mouseToGridX(int mx) { mx -= GRID_OFFSET_X; int gx = mx/CELL_SIZE; return (gx<0||gx>=GRID)?-1:gx; }
int mouseToGridY(int my) { my -= GRID_OFFSET_Y; int gy = my/CELL_SIZE; return (gy<0||gy>=GRID)?-1:gy; }

// ── drawBoard ─────────────────────────────────────────────────────────────────
// Draws pipe segments ONLY between consecutive cells in saved_paths.
// Drawing between ANY adjacent same-color cells causes phantom connections
// when a snake path doubles back on itself (U-shapes, spirals, etc.).
// During animation saved_paths may be partially built, so we also do a
// grid-scan fallback when saved_paths is empty.
void drawBoard(const Board &b) {
    float thickness = CELL_SIZE * 0.35f;

    // 1. Cell backgrounds
    for (int x = 0; x < GRID; x++)
        for (int y = 0; y < GRID; y++)
            DrawRectangle(
                GRID_OFFSET_X + y * CELL_SIZE,
                GRID_OFFSET_Y + x * CELL_SIZE,
                CELL_SIZE - 2, CELL_SIZE - 2,
                Color{0, 0, 0, 255});

    // 2. Pipe segments from ordered saved_paths (correct — no phantom connections)
    for (auto &path : b.saved_paths) {
        if (path.size() < 2) continue;
        int color = b.board[path[0].first][path[0].second].color;
        if (!color) continue;
        Color col = color_map[color];
        for (int i = 0; i + 1 < (int)path.size(); i++) {
            Vector2 p1 = {
                GRID_OFFSET_X + path[i].second   * CELL_SIZE + CELL_SIZE * 0.5f,
                GRID_OFFSET_Y + path[i].first    * CELL_SIZE + CELL_SIZE * 0.5f
            };
            Vector2 p2 = {
                GRID_OFFSET_X + path[i+1].second * CELL_SIZE + CELL_SIZE * 0.5f,
                GRID_OFFSET_Y + path[i+1].first  * CELL_SIZE + CELL_SIZE * 0.5f
            };
            DrawLineEx(p1, p2, thickness, col);
        }
    }

    // Fallback: grid scan when saved_paths is empty (animation not yet built)
    if (b.saved_paths.empty()) {
        for (int x = 0; x < GRID; x++) {
            for (int y = 0; y < GRID; y++) {
                const Cell &c = b.board[x][y];
                if (!c.color || (!c.hasPipe && !c.isTerminal)) continue;
                Color col = color_map[c.color];
                float cx = GRID_OFFSET_X + y * CELL_SIZE + CELL_SIZE * 0.5f;
                float cy = GRID_OFFSET_Y + x * CELL_SIZE + CELL_SIZE * 0.5f;
                if (y+1 < GRID) {
                    const Cell &r = b.board[x][y+1];
                    if (r.color == c.color && (r.hasPipe || r.isTerminal))
                        DrawLineEx({cx,cy},{GRID_OFFSET_X+(y+1)*CELL_SIZE+CELL_SIZE*0.5f,cy},thickness,col);
                }
                if (x+1 < GRID) {
                    const Cell &d = b.board[x+1][y];
                    if (d.color == c.color && (d.hasPipe || d.isTerminal))
                        DrawLineEx({cx,cy},{cx,GRID_OFFSET_Y+(x+1)*CELL_SIZE+CELL_SIZE*0.5f},thickness,col);
                }
            }
        }
    }

    // 3. Circles — terminals (large) always, pipe dots only for cells in saved_paths.
    // NEVER draw a dot just because hasPipe=true — hasPipe can be set on cells
    // that aren't properly connected in the path (e.g. during animation), causing
    // phantom dots to appear at unconnected positions.
    set<pair<int,int>> inPath;
    for (auto &path : b.saved_paths)
        for (auto &cell : path)
            inPath.insert(cell);

    for (int x = 0; x < GRID; x++) {
        for (int y = 0; y < GRID; y++) {
            const Cell &c = b.board[x][y];
            if (!c.color) continue;
            Vector2 center = {
                GRID_OFFSET_X + y * CELL_SIZE + CELL_SIZE * 0.5f,
                GRID_OFFSET_Y + x * CELL_SIZE + CELL_SIZE * 0.5f
            };
            if (c.isTerminal)
                DrawCircleV(center, thickness * 0.8f, color_map[c.color]);
            else if (inPath.count({x, y}))
                DrawCircleV(center, thickness * 0.5f, color_map[c.color]);
        }
    }
}

bool allTerminalsConnected(const Board &board) {
    for (int r = 0; r < GRID; r++)
        for (int c = 0; c < GRID; c++)
            if (board.board[r][c].isTerminal && !board.board[r][c].hasPipe)
                return false;
    return true;
}

int countLines(const std::string &filePath) {
    std::ifstream file(filePath);
    if (!file.is_open()) return -1;
    int count = 0;
    std::string line;
    while (std::getline(file, line)) count++;
    return count;
}

int main() {
    auto files = getLevelFiles("levels");
    if (files.empty()) { std::cout << "No level files found\n"; return 1; }

    std::cout << "Select a level:\n";
    for (int i = 0; i < (int)files.size(); i++)
        std::cout << i << ": " << files[i] << "\n";
    int choice; std::cout << "Enter number: "; std::cin >> choice;
    if (choice < 0 || choice >= (int)files.size()) { std::cout << "Invalid\n"; return 1; }

    GRID = countLines(files[choice]);
    if (GRID <= 0) exit(EXIT_FAILURE);

    int screenW = GetMonitorWidth(0), screenH = GetMonitorHeight(0);
    int MAX_UI_SPACE = 300;
    int availableW = screenW - 2*PADDING, availableH = screenH - 2*PADDING - MAX_UI_SPACE;
    availableW = std::max(availableW, GRID); availableH = std::max(availableH, GRID);
    CELL_SIZE = std::min(availableW/GRID, availableH/GRID);
    if (CELL_SIZE < 60) CELL_SIZE = 60;
    if (CELL_SIZE > 80) CELL_SIZE = 80;

    Board board; board.init(GRID); board.loadFromFile(files[choice]);

    for (int row = 0; row < GRID; row++) {
        for (int col = 0; col < GRID; col++)
            cout << board.board[row][col].color << " " << row << " " << col << "\t";
        cout << "\n";
    }

    int windowW = std::max(600, std::min(1800, 2*PADDING + GRID*CELL_SIZE));
    int windowH = std::max(500, std::min(1000, 2*PADDING + GRID*CELL_SIZE + 300));

    SetConfigFlags(FLAG_WINDOW_RESIZABLE | FLAG_WINDOW_MAXIMIZED);
    InitWindow(windowW, windowH, "Flow Game - Raylib");
    SetTargetFPS(60);

    int Monitor = GetCurrentMonitor();
    int sw = GetMonitorWidth(Monitor), sh = GetMonitorHeight(Monitor);
    int posX = std::max(0, (sw-windowW)/2), posY = std::max(0, (sh-windowH)/2);
    SetWindowPosition(posX, posY);

    int gridPixelSize = GRID * CELL_SIZE;
    GRID_OFFSET_X = (GetScreenWidth()  - gridPixelSize) / 2;
    GRID_OFFSET_Y = (GetScreenHeight() - gridPixelSize - 300) / 2;
    if (GRID_OFFSET_Y < 40) GRID_OFFSET_Y = 40;

    Rectangle expand_button = {
        (float)((GetScreenWidth()-200)/2),
        (float)(GRID_OFFSET_Y + gridPixelSize + 20),
        200, 60
    };

    Font roboto_font = LoadFontEx("./resources/fonts/Roboto-Black.ttf", 64, NULL, 250);
    SetTextureFilter(roboto_font.texture, TEXTURE_FILTER_TRILINEAR);

    while (!WindowShouldClose()) {
        Vector2 mouse_pos = GetMousePosition();

        // Phase 1: A* connects one terminal pair per frame
        if (phase == ASTAR_PHASE) {
            auto ai_path = algorithm(board);
            if (!ai_path.empty()) board.makeMove(ai_path);
            else phase = ASTAR_DONE;
        }

        bool expandEnabled = (phase == ASTAR_DONE) && allTerminalsConnected(board);
        bool expand_hover  = CheckCollisionPointRec(mouse_pos, expand_button);
        bool expand_clicked = expand_hover && IsMouseButtonPressed(MOUSE_LEFT_BUTTON);

        if (expand_clicked && expandEnabled) {
            // Run solver: Warnsdorff + elongation → builds solveEvents
            solveBoard(board);

            // Wipe board to terminals-only for clean animation
            for (int r = 0; r < GRID; r++)
                for (int c = 0; c < GRID; c++) {
                    board.board[r][c].hasPipe = false;
                    if (!board.board[r][c].isTerminal) board.board[r][c].color = 0;
                }
            board.saved_paths.clear();

            eventIndex = 0;
            phase = EXPANDING;
            cout << "Expansion started: " << solveEvents.size() << " events\n";
        }

        // Phase 3: replay animation events (place-only)
        if (phase == EXPANDING) {
            for (int i = 0; i < eventsPerFrame && eventIndex < (int)solveEvents.size(); i++) {
                auto &e = solveEvents[eventIndex++];
                int r = e.cellIdx / GRID, c = e.cellIdx % GRID;
                board.board[r][c].color  = e.color;
                board.board[r][c].hasPipe = true;
            }
            // Rebuild saved_paths each frame so drawBoard uses path-based rendering
            rebuildPaths(board);

            if (eventIndex >= (int)solveEvents.size()) {
                // Snap to final correct solution
                for (int r = 0; r < GRID; r++)
                    for (int c = 0; c < GRID; c++) {
                        board.board[r][c].hasPipe = false;
                        if (!board.board[r][c].isTerminal) board.board[r][c].color = 0;
                    }
                applyBestToBoard(board);
                phase = EXPANSION_DONE;
                cout << "Expansion complete\n";
            }
        }

        // ----- DRAWING -----
        BeginDrawing();
        ClearBackground(RAYWHITE);
        drawBoard(board);

        if (phase == ASTAR_DONE) {
            Color btnColor = !expandEnabled ? DARKGRAY : expand_hover ? LIGHTGRAY : GRAY;
            DrawRectangleRec(expand_button, btnColor);
            DrawRectangleLines((int)expand_button.x,(int)expand_button.y,
                               (int)expand_button.width,(int)expand_button.height, BLACK);
            DrawTextEx(roboto_font, "Expand",
                       (Vector2){expand_button.x+45, expand_button.y+15},
                       32, 2, expandEnabled ? BLACK : Color{120,120,120,255});
        }

        const char *statusText = "";
        if      (phase == ASTAR_PHASE)  statusText = "Connecting terminals (A*)...";
        else if (phase == ASTAR_DONE && !allTerminalsConnected(board)) statusText = "Some pairs blocked!";
        else if (phase == ASTAR_DONE)   statusText = "Ready - click Expand";
        else if (phase == EXPANDING)    statusText = "Expanding...";
        else if (phase == EXPANSION_DONE) statusText = "Expansion complete!";
        // else (phase == EXPANDING);

        DrawTextEx(roboto_font, statusText,
                   (Vector2){(float)GRID_OFFSET_X, (float)(GRID_OFFSET_Y + gridPixelSize + 90)},
                   20, 2, DARKGRAY);

        EndDrawing();
    }

    CloseWindow();
    return 0;
}