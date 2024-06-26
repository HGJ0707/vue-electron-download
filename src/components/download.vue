<template>
  <div class="box">
    <a-alert message="视频保存在电脑的“下载”目录下" type="info" show-icon>
      <template #action>
        <a-button size="small" @click="openLocalFile">打开下载目录</a-button>
      </template>
    </a-alert>
    <div class="form-box">
      <a-form layout="inline" style="justify-content: space-between">
        <a-form-item label="设置保存前缀">
          <a-input
            v-model:value="savePrefix"
            :maxlength="10"
            style="width: 150px"
            allowClear
            showCount
          />
        </a-form-item>
        <div class="btn-box">
          <a-button type="primary" danger @click="pasteParams">
            粘贴并解析
          </a-button>
          <a-button type="primary" danger @click="handleSingleVideo">
            单个链接
          </a-button>
          <a-button type="primary" @click="download(0)">下载一</a-button>
          <a-button type="primary" @click="download(1)">下载二</a-button>
        </div>
      </a-form>
    </div>

    <a-tabs v-model:activeKey="activeKey">
      <a-tab-pane key="1" tab="下载参数">
        <a-textarea
          id="ParamsTextArea"
          v-model:value="params"
          placeholder="请输入下载参数"
          spellcheck="false"
          class="params"
          :rows="22"
        />
      </a-tab-pane>
      <a-tab-pane key="2" tab="相关评论" force-render>
        <a-list :data-source="descs" :locale="{ emptyText: '暂无内容' }">
          <template #renderItem="{ item, index }">
            <a-list-item>
              <a-textarea :id="`inputDom${index}`" :value="item" />
              <template #actions>
                <a key="list-loadmore-more"
                  ><CopyOutlined @click="copyComment(index)"
                /></a>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </a-tab-pane>
    </a-tabs>
  </div>
  <div class="footer">2023 © GGBond</div>
</template>

<script setup>
import { ref } from "vue";
import { message } from "ant-design-vue";
import { CopyOutlined } from "@ant-design/icons-vue";
import { useIpcRenderer } from "@vueuse/electron";

const ipcRenderer = useIpcRenderer();
const savePrefix = ref("下载");
const params = ref("");
const descs = ref([]);
const activeKey = ref("1");

// 通知主进程打开系统下载文件夹
const openLocalFile = () => {
  ipcRenderer.send("open-file");
};

// 粘贴功能
const pasteParams = () => {
  const dom = document.getElementById("ParamsTextArea");
  dom.value = "";
  dom.focus();
  document.execCommand("paste");
};

// 复制功能
const copyComment = (index) => {
  const inputElement = document.getElementById(`inputDom${index}`);
  inputElement.select();
  inputElement.setSelectionRange(0, 99999); // 为了兼容不同浏览器
  document.execCommand("copy");
  inputElement.setSelectionRange(0, 0);
  message.success("复制成功");
};

// 解析参数
async function parseParams(type = "video") {
  try {
    const values = [];
    const parsedJson = JSON.parse(params.value);
    if (type === "video") {
      parsedJson?.forEach((videoItem) => {
        values.push(videoItem?.item?.video?.play_addr?.url_list);
      });
    } else {
      parsedJson?.forEach((videoItem) => {
        values.push(videoItem?.item?.desc);
      });
    }
    return values;
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
      videoName: `${savePrefix.value}-${randomName}.mp4`,
    }); // 向主进程通信
  });
}

// 直接输入视频链接，进行解析
function handleSingleVideo() {
  // 使用正则表达式匹配19位数字
  const pattern = /\b\d{19}\b/g;
  const matches = params.value?.match(pattern);
  if (!matches?.length) {
    message.error("视频地址解析错误");
    return;
  }
  const url = `https://www.douyin.com/aweme/v1/web/aweme/detail?aweme_id=${matches[0]}&screen_width=1920&screen_height=1080`
  ipcRenderer.send("handle-get-video-link", {
    videoLinkUrl: url,
    videoLinkId: matches[0],
  }); 
}

/**
 * 主函数
 * @param {*} index
 */
const download = async (index = 0) => {
  if (!params.value) {
    message.error("请输入参数");
    return;
  }

  const videoUrls = await parseParams("video");
  descs.value = await parseParams("desc");

  const urls = await getDownloadUrl(videoUrls, index);
  if (urls?.length < 1) {
    message.error("获取视频url错误");
  }
  notificationMain(urls);
};

// 接收主进程的下载状态通知进行提示
ipcRenderer.on("download-video-status", function (event, info) {
  if (info?.status === "success") {
    message.success(`${info.name}下载成功`);
  } else {
    message.error(`${info.name}下载失败，请尝试换一个下载通道`);
  }
});

// 接收主进程的下载状态通知进行提示
ipcRenderer.on("download-video-params", function (event, params2) {
  params.value = params2;
  message.success('单个视频地址解析成功');
});
</script>

<style>
body {
  height: auto !important;
}

::-webkit-scrollbar {
  width: 10px;
  height: 20px;
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgb(201, 205, 212);
}

#ParamsTextArea,
.ant-spin-container {
  height: calc(100vh - 250px) !important;
  overflow-y: auto;
}

.ant-list-item-action {
  margin-inline-start: 20px !important;
}

.ant-list-item {
  padding: 12px 14px 12px 0 !important;
}
</style>

<style scoped>
.box {
  max-width: 650px;
  margin: 35px auto 10px;
}

.form-box {
  text-align: right;
  margin: 30px 0 15px;
}

.btn-box button {
  margin-left: 10px;
}

.footer {
  text-align: center;
  font-size: 12px;
  color: #3c3c3cb3;
}
</style>
