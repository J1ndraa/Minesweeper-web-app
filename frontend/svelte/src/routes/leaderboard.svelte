<!-- 
    File: leaderboard.svelte
    Author: Dominik Šmíd
    Date: 11.12.2024
    Description: 
        This file implements the leaderboard for the Minesweeper game using the Svelte framework. 
        It displays the top players for each difficulty level, allows users to switch between 
        difficulties, and provides an option to delete their own recorded time. The leaderboard 
        dynamically updates based on user interactions and data fetched from the backend.
-->

<script>
    import { onMount } from "svelte";
    import { getUser } from "../services/getUser";
    import { getTopTen } from "../services/getTopTen";
    import { deleteTime } from "../services/deleteTime";

    let username;
    let difficulty = 'easy';
    let topTen = [[], Object];

    onMount(async() => {
        username = await getUser();
        topTen = await getTopTen('easy');
        console.log(topTen);
        // topTen = array of [{nickname, fastestTime}, fastestTime, position]
        // second and third element belong to the signed in user
    });

    let update = async (changeDifficulty) => {
        difficulty = changeDifficulty;
        topTen = await getTopTen(changeDifficulty);
        console.log(topTen[1].position);
    }

    let handleMyTime = async (diff) => {
        await deleteTime(diff);
        await update(diff);
    }
</script>

<main>
    <div class="header">
        <a href="#/"><button class="Menu-button">Menu</button></a>
        <h1 class="headline">MINESWEEPER</h1>
    </div>

    <div class="difficulties">
        <div>
            <button class={difficulty == 'easy' ? 'diff-btn-selected' : 'diff-btn'} on:click={() => update('easy')}>Easy</button>
            <button class={difficulty == 'medium' ? 'diff-btn-selected' : 'diff-btn'} on:click={() => update('medium')}>Medium</button>
            <button class={difficulty == 'hard' ? 'diff-btn-selected' : 'diff-btn'} on:click={() => update('hard')}>Hard</button>
          </div>
    </div>
    <div class="list">
        <div class="headerContainer">
            <div class="position">Position</div>
            <div class="username">Username</div>
            <div class="bestTime">Best Time</div>
        </div>
        {#if topTen[0].length == 0}
            <hr>
            <div class="nodata">No data available</div>
        {/if}
        {#each topTen[0] as data, position}
            <hr>
            <div class={data.nickname == username ? 'inTopTen' : 'item'}>
                <div class="position">{position+1}</div>
                <div class="username">{data.nickname}</div>
                <div class="bestTime">{Math.floor(data.fastestTime / 60)}:{data.fastestTime % 60 < 10 ? "0"+ data.fastestTime % 60 : data.fastestTime % 60}</div>
                {#if data.nickname == username}
                    <button class="trashcan-btn" on:click={handleMyTime(difficulty)}><img class="trashcan" src="img/trash-can.png" alt="trash can"></button>
                {/if}
            </div>
        {/each}
        {#if topTen[1].position}
            <hr class="underTopTen">
            <div class="inTopTen">
                <div class="position">{topTen[1].position}</div>
                <div class="username">{username}</div>
                <div class="bestTime">{Math.floor(topTen[1].fastestTime / 60)}:{topTen[1].fastestTime % 60 < 10 ? "0"+ topTen[1].fastestTime % 60 : topTen[1].fastestTime % 60}</div>
                <button class="trashcan-btn" on:click={handleMyTime(difficulty)}><img class="trashcan" src="img/trash-can.png" alt="trash can"></button>
            </div>
        {/if}
</main>

<style>
    main {
        justify-content: center;
        height: 100vh;
        position: relative;
        overflow: scroll;
    }

    .trashcan-btn {
        padding: 0;
        margin: 0;
        background: none;
        border: none;
        margin-right: 10px;
    }

    .trashcan-btn:active {
        background: none;
    }

    .trashcan {
        filter: brightness(0) invert(1);
        max-height: 25px;
        display: flex;
        align-self: center;
    }

    .trashcan:hover {
        filter: invert(40%) sepia(100%) saturate(1000%) hue-rotate(0deg) brightness(100%);
    }

    hr {
        color: white;
        margin: 0;
    }

    .underTopTen {
        color: white;
        height: 5px;
        background-color: white;
        margin: 0 0 1rem 0;
    }

    .headerContainer {
        display: flex;
        color: #7CD3E7;
        font-weight: 900;
        font-size: 1.2rem;
        cursor: default;
    }

    .position {
        flex: 1;
        text-align: left;
        padding: 10px;
    }

    .username {
        flex: 4;
        text-align: left;
        padding: 10px;
    }

    .bestTime {
        flex: 1;
        text-align: right;
        padding: 10px;
    }

    .nodata {
        display: block;
        text-align: center;
        cursor: default;
        padding: 10px;
    }

    .list {
        color: white;
        background-color: RGBA(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        margin: 1rem 20%;
        padding: 20px;
        border: 5px solid white;
        border-radius: 10px;
    }

    .item {
        display: flex;
        font-size: 1rem;
        color: white;
    }

    .item:hover {
        background-color: RGBA(170,170,170, 0.4);
        cursor: default;
    }

    .inTopTen {
        display: flex;
        font-size: 1rem;
        color: #0A0B20;
        background-color: #7CD3E7;
        border: none;
    }

    .inTopTen:hover {
        background-color: #8db4bd;
        cursor: default;
        border: none;
    }

    .diff-btn-selected {
        color: white;
        font-size: 1.5rem;
        background-color: RGBA(255, 255, 255, 0.2);
        border-color: white;
        border-width: 5px;
        margin: 0 5rem;
    }

    .diff-btn {
        color: white;
        font-size: 1.5rem;
        background-color: RGBA(255, 255, 255, 0.2);
        border-color: white;
        border-width: 1px;
        margin: 0 5rem;
    }

    .header {
    display: flex;
    justify-content: center;
    position: relative;
    }

    .Menu-button {
    position: absolute;
    top: 20%;
    left: 5%;
    }

    .headline {
    color: white;
    font-size: 4rem;
    text-align: center;
    }

    .difficulties {
        display: flex;
        justify-content: center;
    }

    @media(max-width: 1060px) {
        .username {
            flex: 2;
        }

        .difficulties {
            gap: 10px;
        }

        .diff-btn-selected, .diff-btn {
            margin: 0 3rem;
        }
    }

    @media(max-width: 840px) {
        .headline {
            font-size: 2rem;
            margin-top: 2.6rem;
        }

        .Menu-button {
            font-size: 1rem;
            margin: 0;
            top: 40%;
        }

        .diff-btn-selected, .diff-btn {
            margin: 0 1rem;
        }

        .list {
            padding: 10px;
        }

        .item {
            display: flex;
            font-size: 0.8rem;
            color: white;
        }

        .inTopTen {
            font-size: 0.8rem;
        }

        .headerContainer {
            display: flex;
            align-items: center;
            font-size: 0.8rem;
        }

        .username {
            flex: 2;
        }
    }
</style>