import "https://unpkg.com/element-plus/dist/index.css";
import { createApp } from "vue";
import ElementPlus from "element-plus";

//暂时没用
const App = {
  data() {
      return {
          message: "Hello Element Plus",
      };
  },
  methods: {
      clickButton(){
          this.message = 'you do it'
      }
  },
};
const app = createApp(App);
//引用API插件
app.use(ElementPlus);
//加载到app部分
app.mount("#app");