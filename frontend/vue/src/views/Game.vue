<!-- author: Halva Jindřich (xhalva05) -->
<!-- brief: GameView component controls rendering the game board and handling the game logic -->

<template>
  <div id="page" style="width: 100%;justify-self: center;">

    <div class="title_container">
      <p class="title">MINESWEEPER</p>
      <router-link to="/"><button id="menu_btn">Menu<img class="img_btn" src="/menu.png" width="20" height="20"></button></router-link>
      <button id="reset_btn" @click="difficultyChange" >Reset<img class="img_btn" src="/reset.png" width="20" height="20"></button>
    </div>

    <div class="container game">
      <div id="board">
        <div>
          <div v-if="board?.status.isLost || board?.status.isWon">
            <p class="status_text">YOU</p>
          </div>
        </div>
        <div v-if="error">
            <p>Error: {{ error }}</p>
        </div>
        <div v-else-if="board" class="game_board">
          <div v-for="(row, rowIndex) in board.board" :key="rowIndex" class="board_row">
            <div v-for="(cell, cellIndex) in row" :key="cellIndex"
                 :class="{ [cellClass]: true, revealed: cell.isRevealed, flagged: cell.isFlagged, isMine: (cell.value === -1 && cell.isRevealed), nullCell: (cell.value === 0 && cell.isRevealed)}" 
                 class="board_cell" v-on:click.left="reveal_cell(rowIndex, cellIndex)" v-on:click.right="flag_cell(rowIndex, cellIndex)"
                 oncontextmenu="return false;">
              {{ cell.isRevealed ? ((cell.value === -1 || cell.value == 0) ? "" : cell.value) : "" }}
            </div>
          </div>
        </div>
        <div v-else>
          <p>Loading...</p>
        </div>

        <div>
          <div v-if="board?.status.isLost">
            <p class="status_text">LOST</p>
          </div>
          <div v-if="board?.status.isWon">
            <p class="status_text">WON</p>
          </div>
        </div>
      </div>

      <div id="hints">
        <div class="hint">
          <button id="eye_hint" v-on:click="HintReq('reveal')"><i class="fa-solid fa-eye"></i></button>
          <div id="eye_hint_text" style="font-size: small;">Reveal non-mine cell hint. 15 seconds will be added to time</div>
        </div>
        <div class="hint">
          <button id="flag_hint" v-on:click="HintReq('flag')"><i class="fas fa-flag"></i></button>
          <div id="flag_hint_text" style="font-size: small;">Flag mine hint. 15 seconds will be added to time</div>
        </div>
      </div>

      <div id="bottom_info">
        <div class="stats">
          Time: {{ time }} 
        </div>
        <div class="stats">
          Mines left: {{ minesLeft }}
        </div>
        <div class="stats">
          Difficulty: <form><select v-model="difficulty" @change="difficultyChange" id="diff_select">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select></form>
        </div>
      </div>
    </div>

    <div id="chat_btn_div">
      <button id="chat_btn" v-on:click="openCloseChat()">Open chat <i class="fa-regular fa-comment-dots"></i></button>
    </div>
  </div>

  <div id="chat_div" :style="{ display: isChatOpen ? 'grid' : 'none' }">
    <button class="close_btn" v-on:click="openCloseChat()"><i class="fa-solid fa-xmark"></i></button>
    <h3>Welcome to the game chat!</h3>
    <div id="chat_text">
      <div v-for="(msg, index) in chat" :key="index" class="chat_msg">
          <b>{{msg.sender}}</b> : {{msg.content}}<br>
          <span style="color: rgb(255, 255, 255, 0.3);">{{ new Date(((( msg.timestamp.seconds) * 1000))).toUTCString() }}</span><br><br>
      </div>
    </div>
    <form id="chat_input" v-on:submit.prevent="sendChatMsg">
      <input type="text" v-model="newMsg" id="chat_input_text" placeholder="Type your message here...">
      <button type="submit" id="chat_send_btn">Send</button>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { GameBoard } from "@/../../shared/types/game";
import { getUser } from "@/http_requests/getUser";
import { format_time } from "@/lib/format-time";
import { count_mines_left } from "@/lib/count-mines-left";
import { changeDifficulty } from "@/http_requests/changeDifficulty";
import { revealCell } from "@/http_requests/revealCell";
import { flagCell } from "@/http_requests/flagCell";
import { sendTimeToBE } from "@/http_requests/sendTimeToBE";
import { hint } from "@/http_requests/hint";
import { getChatMsgs } from "@/http_requests/getChatMsgs";
import { sendChatMsg } from "@/http_requests/sendChatMsg";
 
export default defineComponent({
  name: "GameView",
  data() {
    return {
      board: null as GameBoard | null,
      nickname: getUser(),
      time: format_time(0),
      newMsg: "" as string,
      chat: [] as { id: string; content: string, timestamp: { seconds: number, nanoseconds: number }, sender: string }[],
      timer: null as number | null,
      difficulty: "medium",
      isChatOpen: false,
      error: null as string | null,
    };
  },
  computed: {
    //show the number of mines left on the board
    minesLeft(): number {
      return this.board ? count_mines_left(this.board) : 0;
    },
    //set the cell clas based on the difficulty
    cellClass(): string {
      return `board_cell_${this.difficulty}`;
    },
  },
  methods: {
    //start the timer
    initTimer(seconds: number = 0) {
      this.timer = setInterval(() => {
        seconds++;
        this.time = format_time(seconds);
      }, 1000);
    },
    //add 15 seconds to the timer (hint was used)
    add15Seconds(){
      var act_time = this.time.split(":");
      var act_seconds = parseInt(act_time[0]) * 60 + parseInt(act_time[1]);
      act_seconds += 15;
      clearInterval(this.timer!);
      this.time = format_time(act_seconds);
      this.initTimer(act_seconds);
    },
    //change the difficulty of the game
    async difficultyChange() {
      clearInterval(this.timer!);
      this.time = format_time(0);
      this.initTimer();
      try {
        changeDifficulty(this.difficulty).then((newBoard) => {
          this.board = newBoard;
        });
      }
      catch (err) {
        this.error = (err as Error).message;
      }
    },
    //reveal the cell on the board after left click
    async reveal_cell(row: number, col: number) {
      console.log("reveal cell");
      if (this.board) {
        this.board = await revealCell(row, col);
        if(this.board.status.isLost || this.board.status.isWon){
          //stop the timer if the game is over
          clearInterval(this.timer!);
          if(this.board.status.isWon){
            this.actualizeLeaderboard();
          }
        }
      }
    },
    //flag the cell on the board after right click
    async flag_cell(row: number, col: number) {
      console.log("flag cell");
      if (this.board) {
        //check if the game is not over
        if(this.board.status.isLost || this.board.status.isWon){
          clearInterval(this.timer!);
          if(this.board.status.isWon){
            this.actualizeLeaderboard();
          }
        }
        this.board = await flagCell(row, col);
      }
    },
    //send the time to the backend to actualize the leaderboard
    async actualizeLeaderboard() {
      try{
        var act_time = this.time.split(":");
        var act_seconds = parseInt(act_time[0]) * 60 + parseInt(act_time[1]);
        sendTimeToBE(act_seconds, this.difficulty);
      }
      catch (err) {
        this.error = (err as Error).message;
      }
    },
    //send the hint request to the backend
    async HintReq(action: string){
      if (this.board && !this.board.status.isLost && !this.board.status.isWon && (action === 'reveal' || action === 'flag')){
        //send the hint request to the backend  
        this.board = await hint(action);
        this.add15Seconds();

        //check if the game is over
        if(this.board?.status.isLost || this.board?.status.isWon){
          clearInterval(this.timer!);
          if(this.board.status.isWon){
            this.actualizeLeaderboard();
          }
        }
      }
    },
    //open or close the chat
    openCloseChat(){
      this.isChatOpen = !this.isChatOpen;
    },
    //send the chat message to the backend
    async sendChatMsg(){
      if(this.newMsg.trim() !== ""){
        try{
          await sendChatMsg(this.newMsg);
          this.newMsg = "";
          this.chat = await getChatMsgs();
        }
        catch (err) {
          this.error = (err as Error).message;
        }
      }
    }
  },
  //generate the game board and start the timer at the beginning
  async mounted() {
    try {
      //generate new game board;
      changeDifficulty(this.difficulty).then((newBoard) => {
        this.board = newBoard;
      });
      this.initTimer();
      this.chat = await getChatMsgs();
    }
    catch (err) {
      this.error = (err as Error).message;
    }
  }
});
</script>
  
<!--CSS styles for GameView-->
<style scoped>
  .title_container{
    margin: 0;
  }
  .title{
    color: white;
    text-shadow: 1px 1px 5px black;
    overflow-wrap: anywhere;
  }

  #menu_btn{
    position: absolute;
    top: 20px;
    left: 20px;
    padding: 10px 15px;
    box-shadow: 5px 5px 2px rgba(255, 255, 255, 0.209);
  }
  #reset_btn{
    position: absolute;
    top: 20px;
    right: 20px;
    padding: 10px 15px;
    box-shadow: 5px 5px 2px rgba(255, 255, 255, 0.209);
  }
  .img_btn{
    margin-left: 8px;
  }
  .game_board {
    display: grid;
    gap: 3px;
    justify-content: center;
  }
  #board{
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }
  .board_row {
    display: flex;
    gap: 3px;
  }

  /* styles for a board cells */
  .board_cell {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 4px;
    box-shadow: inset 4px 3px 2px rgb(115, 153, 176);
    background-color: #7CD3E7;
    font-family:'Inter';
  }
  .board_cell:hover {
    background-color: #6AB9D4;
  }
  .board_cell.revealed {
    background-color: #0A0B20;
    box-shadow: inset 3px 3px 2px rgb(0, 0, 0);
    box-shadow: 0px 0px 1px white;
    cursor: default;
  }
  .board_cell.flagged::after {
    content: "🚩";
    font-size: 18px;
  }
  .board_cell.isMine::after {
    content: "💣";
    font-size: 18px;
  }
  .board_cell.isMine{
    background-color: #FF7373;  
  }
  .board_cell.nullCell{
    box-shadow: inset 0px 0px 0px rgb(0, 0, 0);
    content: "";
  }

  /* styles for showing the stats at the bottom of a page */
  #bottom_info{
    display: flex;
    margin-top: 20px;
    gap: 5%;
    justify-content: center;
  }
  .stats{
    color: black;
    background-color: white;
    padding: 10px 15px;
    border-radius: 15px;
    box-shadow: inset 5px 5px 2px rgb(167, 167, 167);
    display: flex;
  }
  #diff_select{
    margin-left: 4px;
    padding: 2px;
    border-radius: 7px;
    border: 0px;
    box-shadow: 1px 1px 3px rgb(54, 54, 54);
  }

  /* Styles for the status info at the end of the game */
  .status_text{
    font-size: 3em;
    color: white;
    text-shadow: 1px 1px 5px black;
    margin-top: 20px;
    overflow-wrap: anywhere;
    width: 40px;
    padding: 0px 20px;
  }

  /* styles for the hints */
  #hints{
    display: flex;
    justify-content: center;
  } 
  .hint{
    position: relative;
  }
  #eye_hint, #flag_hint{
    color: white;
    background-color: rgb(255, 255, 255, 0.05);
    box-shadow: 0px 0px 2px rgba(255, 255, 255, 0.5);
  }
  #eye_hint_text{
    width: 30vw;
    display: none;
    position: absolute;
    background-color: black;
    color: white;
    padding: 4px;
    border-radius: 2px;
    box-shadow: 2px 2px 2px rgba(20, 20, 20, 0.209);
  }
  #flag_hint_text{
    width: 30vw;
    display: none;
    position: absolute;
    background-color: black;
    color: white;
    padding: 4px;
    border-radius: 2px;
    box-shadow: 2px 2px 2px rgba(20, 20, 20, 0.209);
  }
  .hint:hover #eye_hint_text{
    display: block;
  }
  .hint:hover #flag_hint_text{
    display: block;
  }

  /* styles for the chat */
  #chat_btn_div{
    position: relative;
  }
  #chat_btn{
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 15px;
    box-shadow: 0px 0px 2px rgba(255, 255, 255, 0.5);
    color: white;
    background-color: rgb(255, 255, 255, 0.05);
  }
  #chat_div{
    align-content: space-between;
    background-color: black;
    position: fixed;
    top: 0px;
    right: 0px;
    height: 100vh;
    padding: 0px 15px;
    border-left: 1px solid white;
    box-shadow: -10px 0px 5px rgba(0, 0, 0, 0.4);
    font-size: medium;
    text-align: left;
  }
  .close_btn{
    position: absolute;
    background-color: black;
    color: white;
    top: 0px;
    right: 5px;
    padding: 5px 10px;
    font-size: medium;
    box-shadow: 0px 0px 2px rgba(255, 255, 255);
  }
  #chat_text{ 
    overflow-y: scroll;
    scrollbar-color: white #0A0B20;
  }
  #chat_input{
    display: flex;
    justify-content: center;
    align-items: center;
  }
  #chat_input_text{
    width: 70%;
    padding: 8px;
    border-radius: 15px;
    border: 0px;
    box-shadow: 0px 0px 2px rgba(255, 255, 255);
    background-color: black;
    color: white;
  }
  #chat_send_btn{
    background-color: black;
    color: white;
    padding: 5px 10px;
    font-size: medium;
    box-shadow: 0px 0px 2px rgba(255, 255, 255);
  }
</style>