<template>
  <div class="box">
    <a-space wrap>
      <a-button type="primary" danger :disabled="!params" @click="params = ''"
        >清除下载参数</a-button
      >
      <a-button type="primary" @click="download(0)">下载通道一</a-button>
      <a-button type="primary" @click="download(1)">下载通道二</a-button>
    </a-space>
    <a-textarea
      v-model:value="params"
      placeholder="请输入下载参数"
      spellcheck="false"
      class="params"
      :rows="32"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { message } from "ant-design-vue";
import { useIpcRenderer } from "@vueuse/electron";

const ipcRenderer = useIpcRenderer();
const params = ref("");

// 解析参数
async function parseParams() {
  try {
    const videoUrls = [];
    const parsedJson = JSON.parse(params.value);
    console.log(parsedJson, "===parsedJson");

    parsedJson?.forEach((videoItem) => {
      videoUrls.push(videoItem?.item?.video?.play_addr?.url_list);
    });
    return videoUrls;
  } catch (error) {
    console.error(error);
    message.error("参数解析错误，请检查输入的下载参数");
  }
}

// 获取指定urls
async function getDownloadUrl(videoUrlArray, index) {
  if (videoUrlArray[0]?.length - 1 < index) {
    return [];
  }
  return videoUrlArray.map((item) => {
    return item[index];
  });
}

// 通知主进程下载视频
function notificationMain(urls) {
  urls.forEach((url) => {
    const randomName = Math.random().toString().slice(-12);
    ipcRenderer.send("window-new", {
      videoUrl: url,
      videoName: `${randomName}.mp4`,
    }); // 向主进程通信
  });
}

// 接收主进程的下载状态通知进行提示
ipcRenderer.on("download-video-status", function (event, info) {
  console.log(info?.fileStream, "==fileStream");
  if (info?.status === "success") {
    message.success(`${info.name}下载成功`);
  } else {
    message.error(`${info.name}下载失败，请尝试换一个下载通道`);
  }
});

const download = async (index = 0) => {
  if (!params.value) {
    message.error("请输入参数");
    return;
  }

  const videoUrls = await parseParams();
  console.log(videoUrls, "====videoUrls", index, "===index");

  const urls = await getDownloadUrl(videoUrls, index);
  if (urls?.length < 1) {
    message.error("获取视频url错误");
  }
  notificationMain(urls);
};
</script>

<style>
body {
  height: auto !important;
}
</style>

<style scoped>
.box {
  max-width: 800px;
  margin: 70px auto 20px;
  text-align: right;
}

.params {
  margin-top: 30px;
}
</style>
