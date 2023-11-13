window.addEventListener(`contextmenu`, (e) => {
	e.preventDefault();
});

document.addEventListener('DOMContentLoaded', function () {
	const board = document.getElementById('board');
	const boardSizeInput = document.getElementById('boardSize');
	const mineCountInput = document.getElementById('mineCount');
	const mineCounter = document.getElementById('mineCounter');
	const timerDisplay = document.getElementById('timerDisplay');
	const resetButton = document.getElementById('resetButton');
	let boardSize = parseInt(boardSizeInput.value);
	let mines = parseInt(mineCountInput.value);
	let mineLocations = [];
	let revealedCells = 0;
	let flaggedMines = 0;
	let gameInProgress = false;
	let timerInterval;

	resetButton.addEventListener('click', resetGame);

	function handleCellClick(event) {
		if (!gameInProgress) {
			gameInProgress = true; // Start the game on the first click
			startTimer(); // Start the timer on the first click
		}

		const row = parseInt(event.currentTarget.getAttribute('data-row'));
		const col = parseInt(event.currentTarget.getAttribute('data-col'));

		if (mineLocations.length === 0) {
			// If it's the first click, place mines on the board
			placeMines(row, col);
			gameInProgress = true;
		}

		if (event.button === 0) {
			revealCell(row, col);
		} else if (event.button === 2) {
			flagCell(row, col);
		} else if (event.button === 1) {
			chordCell(row, col);
		}
	}

	function startTimer() {
		let seconds = 0;
		timerInterval = setInterval(function () {
			seconds++;
			timerDisplay.textContent = seconds;
		}, 1000);
	}

	function stopTimer() {
		clearInterval(timerInterval);
	}


	function updateMineCounter() {
		mineCounter.textContent = `${mines - flaggedMines}`;
	}

	function placeMines(initialRow, initialCol) {
		const excludePositions = getAdjacentPositions(initialRow, initialCol);
		while (mineLocations.length < mines) {
			const randomRow = Math.floor(Math.random() * boardSize);
			const randomCol = Math.floor(Math.random() * boardSize);
			const minePosition = `${randomRow}-${randomCol}`;

			if (
				!mineLocations.includes(minePosition) &&
				!excludePositions.includes(minePosition)
			) {
				mineLocations.push(minePosition);
			}
		}

		updateMineCounter();
	}

	function getAdjacentPositions(row, col) {
		const positions = [];
		for (let i = row - 1; i <= row + 1; i++) {
			for (let j = col - 1; j <= col + 1; j++) {
				if (i >= 0 && i < boardSize && j >= 0 && j < boardSize) {
					positions.push(`${i}-${j}`);
				}
			}
		}
		return positions;
	}

	function createBoard() {
		for (let i = 0; i < boardSize; i++) {
			for (let j = 0; j < boardSize; j++) {
				const cell = document.createElement('div');
				cell.className = 'cell';
				cell.setAttribute('data-row', i);
				cell.setAttribute('data-col', j);
				cell.addEventListener('mousedown', handleCellClick);
				cell.style['width'] = `${400 / boardSize}px`;
				cell.style['height'] = `${400 / boardSize}px`;
				board.style['grid-template-columns'] = `repeat(${boardSize}, ${400 / boardSize
					}px)`;
				board.appendChild(cell);
			}
		}
	}

	function countMinesNearby(row, col) {
		let count = 0;

		for (let i = row - 1; i <= row + 1; i++) {
			for (let j = col - 1; j <= col + 1; j++) {
				if (
					i >= 0 &&
					i < boardSize &&
					j >= 0 &&
					j < boardSize &&
					mineLocations.includes(`${i}-${j}`)
				) {
					count++;
				}
			}
		}

		return count;
	}

	function revealCell(row, col) {
		const cell = document.querySelector(
			`.cell[data-row="${row}"][data-col="${col}"]`,
		);

		if (
			!cell ||
			cell.classList.contains('revealed') ||
			cell.classList.contains('flagged')
		) {
			return;
		}

		if (mineLocations.includes(`${row}-${col}`)) {
			cell.classList.add("mineClicked");
			gameOver();
		} else {
			const minesNearby = countMinesNearby(row, col);
			cell.textContent = minesNearby || '';
			cell.classList.add('revealed');
			revealedCells++;

			if (minesNearby === 0) {
				revealAdjacentCells(row, col);
			}

			if (revealedCells === boardSize * boardSize - mines) {
				alert('You win!');
				const allCells = document.querySelectorAll('.cell');

				allCells.forEach((cell) => {
					const [row, col] = [
						cell.getAttribute('data-row'),
						cell.getAttribute('data-col'),
					];
					cell.classList.add('flagged');
				});
				setTimeout(resetGame, 1000);
			}
		}
	}

	function revealAdjacentCells(row, col) {
		for (let i = row - 1; i <= row + 1; i++) {
			for (let j = col - 1; j <= col + 1; j++) {
				if (i >= 0 && i < boardSize && j >= 0 && j < boardSize) {
					revealCell(i, j);
				}
			}
		}
	}

	function flagCell(row, col) {
		const cell = document.querySelector(
			`[data-row="${row}"][data-col="${col}"]`,
		);
		if (
			!cell.classList.contains('flagged') &&
			flaggedMines < mines &&
			!cell.classList.contains('revealed')
		) {
			cell.classList.add('flagged');
			flaggedMines++;
		} else if (cell.classList.contains('flagged')) {
			cell.classList.remove('flagged');
			flaggedMines--;
		}

		// Update mine counter
		updateMineCounter();
	}

	function chordCell(row, col) {
		const cell = document.querySelector(
			`.cell[data-row="${row}"][data-col="${col}"]`,
		);

		if (!cell || !cell.classList.contains('revealed')) {
			return;
		}

		const flaggedNeighbors = countFlaggedNeighbors(row, col);
		const minesNearby = countMinesNearby(row, col);

		if (minesNearby === flaggedNeighbors) {
			for (let i = row - 1; i <= row + 1; i++) {
				for (let j = col - 1; j <= col + 1; j++) {
					if (
						i >= 0 &&
						i < boardSize &&
						j >= 0 &&
						j < boardSize &&
						!document
							.querySelector(`.cell[data-row="${i}"][data-col="${j}"]`)
							.classList.contains('revealed')
					) {
						revealCell(i, j);
					}
				}
			}
		}
	}

	function countFlaggedNeighbors(row, col) {
		let count = 0;

		for (let i = row - 1; i <= row + 1; i++) {
			for (let j = col - 1; j <= col + 1; j++) {
				if (
					i >= 0 &&
					i < boardSize &&
					j >= 0 &&
					j < boardSize &&
					document
						.querySelector(`.cell[data-row="${i}"][data-col="${j}"]`)
						.classList.contains('flagged')
				) {
					count++;
				}
			}
		}

		return count;
	}

	function resetGame() {
		// Reset input values
		boardSize = parseInt(boardSizeInput.value);
		mines = parseInt(mineCountInput.value);
		stopTimer();
		startTimer();
		// Clear the board and reset the game state
		board.innerHTML = '';
		mineLocations = [];
		revealedCells = 0;
		flaggedMines = 0;
		gameInProgress = true;

		// Update mine counter
		updateMineCounter();
		// Create a new board
		createBoard();
	}

	function gameOver() {
		const allCells = document.querySelectorAll('.cell');

		allCells.forEach((cell) => {
			const [row, col] = [
				cell.getAttribute('data-row'),
				cell.getAttribute('data-col'),
			];

			if (mineLocations.includes(`${row}-${col}`) && !cell.classList.contains('mineClicked')) {
				cell.classList.add('mine');
			} else if (
				cell.classList.contains('flagged') &&
				!mineLocations.includes(`${row}-${col}`)
			) {
				cell.classList.add('badFlag');
			}

			cell.removeEventListener('mousedown', function (event) {
				if (event.button === 0) {
					revealCell(row, col);
				} else if (event.button === 2) {
					flagCell(row, col);
				} else if (event.button === 1) {
					chordCell(row, col);
				}
			});
		});
		alert('Oi bruv you lost innit');
		setTimeout(resetGame, 1000); // Reset the game after 1 second
	}

	createBoard();
});
