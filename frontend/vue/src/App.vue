<!-- author: Halva Jindřich (xhalva05) -->
<!-- brief: Main App component that renders the view based on the current route -->

<template>
  <router-view />
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  font-family: Itim, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: white;
}
button, .button {
    margin-top: 10px;
    background-color: #ffffff;
    color: black;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-family: Itim, sans-serif;
    box-shadow: 1px 1px 5px black;
    font-size: 25px;
    padding: 5px 10px;
    margin: 15px;
  }
  button:hover, .button:hover {
    background-color: #eeeeee;
    transform: scale(1.05);
  }
  input{
    padding: 10px;
    border-radius: 15px;
    border: 1px solid #ccc;
    box-shadow: 1px 1px 5px black;
    margin: 10px;
  }
  .title{
    font-size: 50px;
    color: white;
    text-shadow: 1px 1px 5px black;
    margin-bottom: 25px;
  }
</style>