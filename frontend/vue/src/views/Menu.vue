<!-- author: Halva Jindřich (xhalva05) -->
<!-- brief: MenuView component controls rendering the main menu and authentication by nickname -->

<template>
  <div id="page">
    <div class="container">
      <p class="title">MINESWEEPER</p>
      <form @submit.prevent="handlePlay">
        <label class="input-text" for="nickname">enter your nickname:</label><br>
        <input type="text" id="nickname" name="nickname" v-model="nickname" @input="validateNickname"><br>
        <p v-if="error">{{ error }}</p>
        <button :disabled="isPlayDisabled" type="submit" >Play</button>
      </form>
      <router-link to="/tutorial"><button >How to play</button></router-link><br>
      <router-link to="/leaderboard"><button id="leaderboard">Leaderboard</button></router-link>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent } from "vue";
  import { useRouter } from "vue-router";
  import { getUser } from "@/http_requests/getUser";
  import { regUser } from "@/http_requests/regUser";

  export default defineComponent({
    name: "MenuView",
    data(){
      return{
        router: useRouter(),
        nickname: "",
        error: null as string | null, 
        isPlayDisabled: true,
      };
    },
    async mounted() {
      try {
        //get existing nickname and if exists, enable play button
        this.nickname = await getUser();
        this.isPlayDisabled = !this.nickname;
      } catch (err) {
        this.error = "Failed to load an existing nickname. Choose a new one.";
      }
    },
    methods: {
      //validate nickname length
      validateNickname() {
        if (this.nickname.length < 4 || this.nickname.length > 16) {
          this.error = "Nickname must be between 4 and 16 characters.";
          this.isPlayDisabled = true;
        } else {
          this.error = null;
          this.isPlayDisabled = false;
        }
      },
      //handle play button click, if nickname is valid, register user and navigate to game
      async handlePlay() {
        if (!this.isPlayDisabled && this.nickname.trim() !== "") {
          try { 
            await regUser(this.nickname);
            this.router.push({ path: "/game", query: { nickname: this.nickname } });
          } catch (err) {
            console.error("Error:", err);
            this.error = "Nickname is already taken.";
          }
        }
      },
    },
  });
  </script>

  <style scoped>
  .input-text{
    font-size: 25px;
    color: white;
    text-shadow: 1px 1px 5px black;
  }
  #leaderboard{
    position:relative;
  }
  #leaderboard::after{
    content:url("../../public/crown-icon.png");
    position: absolute;
    bottom: 18px;
    right: -8px;
  }
  </style>