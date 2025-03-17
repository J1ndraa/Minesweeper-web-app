<script>
  import Router from 'svelte-spa-router';
  import Game from './routes/game.svelte';
  import Tutorial from './routes/tutorial.svelte';
  import Leaderboard from './routes/leaderboard.svelte';
  import Notfound from './routes/notfound.svelte';
  import MainMenu from './routes/main_menu.svelte';

  let routes = {
    "/": MainMenu,
    "/game": Game,
    "/tutorial": Tutorial,
    "/leaderboard": Leaderboard,

    "*": Notfound
  }
</script>


<main>
  <Router {routes}/>
</main>
