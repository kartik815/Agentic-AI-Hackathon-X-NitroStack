#ifndef ALGO_H
#define ALGO_H

#include "board.h"
#include "globals.h"
#include <cstdint>
#include <vector>
#include <utility>

typedef uint64_t Mask;

struct SolveEvent {
    int cellIdx;
    int color;
    bool place; // true = place cell, false = remove (backtrack)
};

extern std::vector<Mask> neighborMask;
extern Mask terminalMask;
extern std::vector<SolveEvent> solveEvents;

void solveBoard(Board &board);
void applyBestToBoard(Board &board);
void rebuildPaths(Board &board);
// Top-level called by main.cpp
std::vector<std::pair<int, int>> algorithm(const Board &board);

// Utilities (kept for compatibility & testing)
std::vector<std::vector<int>> getTerminals(const Board &board);
int randomInt(int upper_bound);
bool colorAlreadyAdded(int color, std::vector<std::vector<int>> colors);

// Original-like helpers (reused/ported)
std::vector<std::pair<int, int>> getNeighbors(int color, int row, int col,
                                              const Board &board,
                                              const std::vector<std::vector<bool>> &visited);

std::vector<std::pair<int, int>>
reconstructPath(int end_row, int end_col,
                const std::vector<std::vector<std::pair<int, int>>> &parents);

#endif