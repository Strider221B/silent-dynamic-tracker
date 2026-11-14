#!/usr/bin/env bash
set -euo pipefail

echo "========================================================"
echo " Starting Full Local CI Verification — Silent Dynamic Tracker"
echo "========================================================"

# --- BACKEND CI ---
echo ""
echo ">>> [1/6] Backend: Linting (ruff)..."
cd backend
source ~/python_envs/p313_llm/bin/activate
uv run --with ruff ruff check .

echo ">>> [2/6] Backend: Type Checking (mypy strict)..."
uv run --with mypy mypy app

echo ">>> [3/6] Backend: Unit & Coverage Tests (pytest >= 90%)..."
uv run pytest
cd ..

# --- FRONTEND CI ---
echo ""
echo ">>> [4/6] Frontend: Linting (ESLint)..."
cd frontend
npm run lint

echo ">>> [5/6] Frontend: Type Checking (tsc strict)..."
npx tsc --noEmit

echo ">>> [6/6] Frontend: Unit & Integration Tests (Vitest >= 90%)..."
npm run test -- --coverage
cd ..

echo ""
echo "========================================================"
echo " ALL CI VERIFICATIONS PASSED SUCCESSFULLY (100% CLEAN)!"
echo "========================================================"
