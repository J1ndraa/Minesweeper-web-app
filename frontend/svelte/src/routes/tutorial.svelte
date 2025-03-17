<!--
  File: tutorial.svelte
  Author: Dominik Šmíd
  Date: 11.12.2024

  Description:
  Minesweeper tutorial page with a responsive image slideshow and an "End" button to exit.
-->

<script>
  import { onMount } from 'svelte';

  onMount(() => {
    document.body.classList.add('light-bg'); // Add blue background class
    return () => {
      document.body.classList.remove('light-bg'); // Remove it when leaving the page
    };
  });

  let currentIndex = 0;

  // Array of image URLs or paths
  const images = [
    "/img/tutorial-1.png",
    "/img/tutorial-2.png",
    "/img/tutorial-3.png",
    "/img/tutorial-4.png",
    "/img/tutorial-5.png",
    "/img/tutorial-6.png",
    "/img/tutorial-7.png",
  ];

  // Next image handler
  function nextImage() {
    if (currentIndex != images.length-1) {
      currentIndex = (currentIndex + 1) % images.length;
    }
  }

  // Previous image handler
  function prevImage() {
    if (currentIndex != 0) {
      currentIndex = (currentIndex - 1 + images.length) % images.length;      
    }
  }
</script>


<main class="tutorialmain">
  <div class="header">
    <a href="#/"><button class="end-button">End</button></a>
    <h1 class="headline">MINESWEEPER TUTORIAL</h1>
  </div>
  <div class="slideshow-container">
    <button class={currentIndex == 0 ? "arrow-dis" : "arrow-btn"} on:click={prevImage}><img class="arrow" src="/img/arrow_left.png" alt="left arrow"></button>
    <img src={images[currentIndex]} alt="Slideshow" class="slideshow-image">
    <button class={currentIndex == images.length-1 ? "arrow-dis" : "arrow-btn"} on:click={nextImage}><img class="arrow" src="/img/arrow_right.png" alt="right arrow"></button>
  </div>
</main>


<style>
  main {
    height: 100vh;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    cursor: pointer; 
  }

  .tutorialmain {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .header {
    position: relative;
    width: 100%;
  }

  .end-button {
    position: absolute;
    top: 20%;
    left: 5%;
    padding: 15px 30px;
  }

  .slideshow-container {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 55%;
    height: fit-content;
    position: relative;
    overflow: hidden;
  }

  .arrow-btn {
    border-radius: 30pt;
    border: none;
  }

  .arrow-dis {
    border-radius: 30pt;
    border: none;
    background-color: gray;
    cursor: default;
  }

  .arrow-dis:active {
    background-color: gray;
  }

  .arrow {
    width: 50px;
  }

  .slideshow-image {
    width: 100%;
    height: auto;
  }

  @media(max-width: 1260px) {
    .headline {
      font-size: 3.5rem;
      margin-top: 50px;
    }

    .slideshow-container {
      width: 70%;
    }

    .end-button {
      font-size: 1.7rem;
      position: absolute;
      top: 44px;
      left: 4vw;
      padding: 15px 20px;
    }

    .arrow {
      width: 40px;
    }
  }

  @media(max-width: 1000px) {
    .headline {
      width: min-content;
      font-size: 4rem;
      margin-top: 50px;
      margin-bottom: 0;
    }

    .header {
      display: flex;
      justify-content: center;
    }

    .slideshow-container {
      width: 90%;
    }

    .end-button {
      font-size: 1.5rem;
      top: 50px;
      left: 2vw;
      padding: 15px 20px;
    }

    .arrow {
      width: 30px;
    }
  }

  @media(max-width: 700px) {
    .headline {
      width: min-content;
      font-size: 2rem;
      margin-top: 50px;
      margin-bottom: 0;
    }

    .header {
      display: flex;
      justify-content: center;
    }

    .slideshow-container {
      width: 100%;
    }

    .end-button {
      font-size: 1rem;
      top: 50px;
      left: 0;
      padding: 10px 15px;
      border-radius: 10px;
    }

    .arrow {
      width: 15px;
    }
  }
</style>