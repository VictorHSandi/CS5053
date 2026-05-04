(function (global) {
    function find(root, id) {
        return (root || document).querySelector("#" + id);
    }

    function createSideMenuController(root) {
        var scoreEl = find(root, "score");
        var totalEl = find(root, "total");
        var elixirStatusEl = find(root, "elixir-status");
        var jumpStatusEl = find(root, "jump-status");
        var messageEl = find(root, "message");

        function setScore(value) {
            if (scoreEl) {
                scoreEl.textContent = String(value);
            }
        }

        function setTotal(value) {
            if (totalEl) {
                totalEl.textContent = String(value);
            }
        }

        function setTotals(score, total) {
            setScore(score);
            setTotal(total);
        }

        function setElixirFound(found) {
            if (!elixirStatusEl) {
                return;
            }
            elixirStatusEl.innerHTML = found
                ? '<span class="green">OK Found</span>'
                : '<span class="red">X Missing</span>';
        }

        function setJumpBoosted(boosted) {
            if (!jumpStatusEl) {
                return;
            }
            jumpStatusEl.innerHTML = boosted
                ? '<span class="green">BOOSTED</span>'
                : '<span class="dim">Normal</span>';
        }

        function setMessage(html) {
            if (messageEl) {
                messageEl.innerHTML = html || "";
            }
        }

        function showWin() {
            setMessage('<span class="win">YOU WIN! Press F to play again</span>');
        }

        return {
            setScore: setScore,
            setTotal: setTotal,
            setTotals: setTotals,
            setElixirFound: setElixirFound,
            setJumpBoosted: setJumpBoosted,
            setMessage: setMessage,
            showWin: showWin
        };
    }

    global.createSideMenuController = createSideMenuController;
}(window));
