<!-- 
    File: main_menu.svelte
    Author: Dominik Šmíd
    Date: 11.12.2024
    Description: 
        This file implements the main menu for the Minesweeper game using the Svelte framework. 
        It allows users to enter a nickname, validate it, and navigate to different sections of the game 
        (Game, Tutorial, and Leaderboard). It also includes error handling for invalid nicknames 
        and user management for new or existing players.
-->

<script>
  import { push } from "svelte-spa-router";
  import { getUser } from "../services/getUser";
  import { createUser } from "../services/createUser";
  import { generateBoard } from "../services/generateBoard";
  import { onMount } from "svelte";

  export let nickname = "";
  let visible = false;
  let exists = false;

  onMount(async() => {
    nickname = await getUser();
    document.body.classList.remove('dark-bg');
  });

  // Called when "Play" button is clicked
  const handlePlay = async () => {
    if (nickname.length > 3 && nickname.length < 16) {
      // username management
      try {
        const existingnick = await getUser();
        if (existingnick != nickname) {
          await createUser(nickname);
          await generateBoard();
        }
        push("/game");

      } catch (error) {
        exists = true;
      }
    //
    } else if (nickname.length === 0) {
      visible = true;
    }
  };

  let handleEnter = (event) => {
    if (event.key === "Enter") {
      handlePlay();
    }
  }
</script>


<main>
  <h1 class="headline">
    MINESWEEPER
  </h1>

  <div class="menuitems">
    <div class="enternick">Enter your nickname:</div>
    <input 
      type="text" 
      bind:value={nickname} 
      on:input={() => visible = false}
      on:input={() => exists = false}
      on:keydown={handleEnter}
      placeholder="nickname"
    >

    <p class="nickname_err">
      {#if nickname.length > 0 && nickname.length < 4}
      Name must be at least 4 characters long
      {/if}
      {#if nickname.length > 15}
      Name must not exceed 15 characters
      {/if}
      {#if visible}
      You cannot play without a nickname
      {/if}
      {#if exists}
      This username already exists
      {/if}
    </p>

    <button on:click={handlePlay}>Play</button>
    <a href="#/tutorial"><button>How to play</button></a>
    <div>
      <a href="#/leaderboard"><button class="leaderboard">Leaderboard</button></a>
      <img class="crownicon" src="img/crown-icon.png" alt="not found">
    </div>
  </div>
</main>


<style>
  main {
    justify-content: center;
    height: 100%;
    position: relative;
    overflow: scroll;
  }

  .nickname_err {
    color: red;
    font-size: 2rem;
    margin: 0;
  }

  .headline {
    color: white;
    text-align: center;
    font-size: 6rem;
  }

  .menuitems {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100vh;
  }

  .enternick {
    color: white;
    font-size: 3rem;
    margin: 1rem;
  }

  input {
    font-size: 2rem;
    border-radius: 10pt;
  }

  .crownicon {
    z-index: 1;
    margin-left: -3rem;
    position: relative;
    top: -1rem;
  }
</style>