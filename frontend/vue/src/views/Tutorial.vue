<!-- author: Halva Jindřich (xhalva05) -->
<!-- brief: TutorialView component controls rendering the tutorial slideshow -->

<template>
    <div id="page">
      <div class="container">
        <p class="title">MINESWEEPER TUTORIAL</p>
        <router-link to="/"><button id="end">END</button></router-link>
        <div id="viewer">
          <button class="img_btn" @click="prevImage"><i class="fa-solid fa-angle-left"></i></button>
          <img :src="currentImage" width="50%" alt="Tutorial slideshow" />
          <button class="img_btn" @click="nextImage"><i class="fa-solid fa-angle-right"></i></button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "TutorialView",
    data(){
      //import all images for the tutorial
      return{
        images:[
          "/tutorial-1.png",
          "/tutorial-2.png",
          "/tutorial-3.png",
          "/tutorial-4.png",
          "/tutorial-5.png",
          "/tutorial-6.png",
          "/tutorial-7.png",
        ],
        index: 0,
      };
    },
    computed:{
      //get the current image from the array
      currentImage(){
        return this.images[this.index];
      }
    },
    //methods for changing the image
    methods:{
      nextImage(){
        if(this.index < this.images.length - 1){
          this.index++;
        }
      },
      prevImage(){
        if(this.index > 0){
          this.index--;
        }
      },
    },  
  };
  </script> 
  
  <style scoped>
  #end{
    position: absolute;
    top: 20px;
    left: 20px;
    padding: 10px 15px;
  }
  #viewer{
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .img_btn{
    border-radius: 80px;
    background: rgba(00, 00, 00, 0.6);
    border: 3px white solid;
    padding: 7px 15px;
    color: white;
  }
  .img_btn:hover{
    background: rgba(00, 00, 00, 0.8);
    color: black;
  }
  </style>