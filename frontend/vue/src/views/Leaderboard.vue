<!-- author: Halva Jindřich (xhalva05) -->
<!-- brief: LeaderboardView component controls rendering the leaderboard -->

<template>
    <div id="page">
      <div class="container">
        <p class="title">MINESWEEPER</p>
        <router-link to="/"><button id="end">END</button></router-link>
        <div class="leaderboard">
          <button class="diff" @click="updateDifficulty('easy')">Easy</button>
          <button class="diff" @click="updateDifficulty('medium')">Medium</button>
          <button class="diff" @click="updateDifficulty('hard')">Hard</button>
          <div id="stats" >
            <h3 style="text-align: center;">Leaderboard for difficulty: {{ difficulty }}</h3>
            <ul style="padding: 0px;">
              <li v-for="(entry, index) in stats" :key="index" class="row">
                <div>{{ index + 1 }}.</div>
                <div>{{ entry.nickname }}</div>
                <div>{{ entry.fastestTime }}s <span v-if="entry.nickname === nick">
                                                <i class="fa-solid fa-trash-can" @click="delTime()" style="cursor: pointer;"></i>
                                              </span>
                </div>
              </li>
            </ul>
            <div v-if="position" id="myStats">
              <div>
                {{ position }}.
              </div>
              <div>
                <strong>{{ nick }}</strong>
              </div>
              <div>
                <strong>Fastest Time:</strong> {{ fastestTime }}s
                <span><button v-on:click="delTime()" style="padding: 1px; margin: 0"><i style="font-size: 18px;" class="fa-solid fa-trash-can"></i></button></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from "vue";
  import { getUser } from '@/http_requests/getUser';
  import { getLeaderboard } from '@/http_requests/getLeaderboard';
  import { deleteTime } from '@/http_requests/deleteTime';

  export default defineComponent({
    name: "LeaderboardView",
    data(){
      return{
        nick: "" as string,
        stats: [] as { nickname: string; fastestTime: number }[],
        fastestTime: 0 as number,
        position: 0 as number,
        difficulty: "easy" as string,
        isSame: false as boolean,
        error : null as string | null,
      };
    },
    async mounted() {
      try {
        //get user nickname
        this.nick = await getUser();
        //get leaderboard data
        await this.getStats();
      }
      catch (err) {
        this.error = "Failed to load an existing nickname. Choose a new one.";
        console.error(err);
      }
    },
    methods: {
      //get leaderboard data from backend
      async getStats() {
        try {
          const [leaderboard, fastestTime, position] = await getLeaderboard(this.difficulty);

          this.stats = leaderboard;
          this.fastestTime = fastestTime;
          this.position = position;
        } 
        catch (err) {
          this.error = "Failed to load leaderboard data.";
          console.error(err);
        }
      },
      //update difficulty and get new stats after button click
      async updateDifficulty(newDifficulty: string) {
        this.difficulty = newDifficulty;
        await this.getStats();
      },
      //delete user's time from leaderboard
      async delTime() {
        try {
          await deleteTime(this.difficulty);
          await this.getStats();
        }
        catch (err) {
          this.error = "delete failed.";
          console.error(err);
        }
      }
    },
  });
  </script>
  
  <style scoped>
  #end{
    position: absolute;
    top: 20px;
    left: 20px;
    padding: 10px 15px;
  }
  .leaderboard{
    display: grid;
    width: 70%;
    justify-self: center;
  }
  #stats{
    grid-row: 2;
    grid-column: 1/4;
    color: white;
    text-align: start;
    font-size: 20px;
    padding: 5px 15px;
    background-color: rgba(255, 255, 255, 0.2);
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
    border: 5px solid white;
    border-radius: 15px;
  }
  .row{
    margin: 5px;
    list-style: none;
    display: flex;
    justify-content: space-between;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }
  #myStats{
    margin-top: 5px;
    padding: 10px;
    border: 1px solid white;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    background-color: rgba(124, 211, 231, 0.2);
  }
  .diff{
    grid-row: 1;
    color: white;
    background-color: rgba(255, 255, 255, 0.2);
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
    padding: 10px;
  }
  .diff:focus{
    border: 5px solid white;
  }
  </style>