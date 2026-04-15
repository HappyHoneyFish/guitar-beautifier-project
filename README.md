# Guitar Beautifier (木音)

[English](#english) | [简体中文](#简体中文)

[![Language](https://img.shields.io/badge/Language-JavaScript%20%2F%20Python-blue.svg)](#)
[![Framework](https://img.shields.io/badge/Framework-FastAPI%20%2F%20WeChat--Mini--Program-green.svg)](#)

## 📖 Introduction

**Guitar Beautifier** is a WeChat Mini Program designed to enhance the quality of guitar videos recorded via mobile phones. 

Many guitar enthusiasts like to record playing videos and share them on social media. However, due to hardware limitations and noise reduction algorithms of mobile phones, directly recorded acoustic guitars often sound muffled, lacking low-end clarity and high-end transparency. This project provides a one-click, cloud-based audio and video enhancement service, allowing ordinary mobile phones to record high-quality guitar videos with the transparency of "small-diaphragm microphones" and the spatial sense of "cathedral reverb".

## ✨ Features

* **Native Recording**: Provides a minimalist recording interface calling the mobile phone camera.
* **One-Click Audio Enhancement**: Customized processing for guitar frequency bands, cutting low-frequency noise, repairing mid-low frequency "boxiness", brightening high-frequency overtones, and adding customized dynamic compression and cathedral reverb.
* **Lightweight Video Filters**: Automatically enhances the brightness and color contrast of the original video, and performs light skin smoothing and noise reduction.
* **Intuitive Comparison & Sharing**: Offers top-and-bottom split-screen comparison playback before and after processing, and supports one-click saving to the local album.

## 🛠️ Tech Stack

* **Frontend**: WeChat Mini Program framework.
* **Backend**: FastAPI asynchronous framework, deployed in a Linux environment.
* **Core Engines**: Audio processing relies on `Pedalboard`, and video processing uses `FFmpeg`.

## 🧬 Core Algorithms

### Audio Enhancement
* **Highpass**: Cuts off below 60Hz to eliminate background noise.
* **Warmth (Peak)**: 120Hz +4dB to restore the acoustic body resonance.
* **De-boxiness (Peak)**: 350Hz -6dB to eliminate the phone recording "boxy" sound.
* **Airiness (Peak)**: 7500Hz +6.5dB to simulate the high-frequency transparency of a small-diaphragm mic.
* **Compressor**: Extremely fast 2ms attack to suppress strumming harshness and improve sound tightness.
* **Cathedral Reverb**: Maximum 1.0 room size to create a deep sense of envelopment.

### Video Beautification
* **3D Denoising (hqdn3d)**: Uses spatial smoothing parameters (5:5:4:4) to produce a natural "soft light" effect.
* **Color Equalization (eq)**: Enhances contrast by 5%, saturation by 15%, and brightness by 2%.

## 🚀 Quick Start

### Backend Setup
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *Note: Ensure FFmpeg 4.x or above is installed in your system environment.*
2. Start the service:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

### Frontend Setup
1. Open the `app.js` file.
2. Modify the `apiBaseUrl` in `globalData` to your official server domain configured with an SSL certificate.

---


# 木音 - 吉他原生音画小程序

## 📖 项目简介

"木音"是一款致力于提升手机录制吉他视频品质的微信小程序。

在日常生活中，许多吉他爱好者喜欢录制弹奏视频并分享到朋友圈。然而，由于手机麦克风的硬件局限性以及系统强制运行的降噪算法，直接录制的原声吉他往往像"闷葫芦"，低音浑浊消失、高音缺乏通透感。本项目旨在通过轻量级的云端算法，为大众用户提供一键式的音画双重美化服务，让普通手机也能录制出具备"小振膜话筒"通透感与"大教堂混响"空间感的高品质吉他视频。

## ✨ 核心功能

* **原生摄录与重录**：提供调用手机摄像头的极简录制界面。
* **一键原声美化**：针对吉他频段定制化处理，切除低频底噪，修复中低频"盒子音"，提亮高频泛音，并增加定制化动态压摆与大教堂混响。
* **轻量画面滤镜**：自动提升原视频的亮度、色彩对比度，并进行轻度磨皮降噪。
* **直观对比与便捷分享**：提供处理前后的上下分屏对比播放，支持一键保存至本地相册，完美契合微信朋友圈的分享路径。

## 🛠️ 技术架构

* **客户端（前端）**：基于微信小程序框架开发。
* **服务端（后端）**：基于 FastAPI 异步框架，部署于 Linux 环境。
* **核心处理引擎**：音频处理模块采用原生 `Pedalboard`，视频处理模块采用 `FFmpeg`。

## 🧬 核心算法说明

### 音频修音算法
* **低切 (Highpass)**：60Hz 切除，消除底噪。
* **温暖度提升 (Peak)**：120Hz 增益 4dB，找回琴箱共鸣。
* **去闷 (Peak)**：350Hz 狠切 6dB，终结手机录音的"盒子音"。
* **空气感 (Peak)**：7500Hz 增益 6.5dB，模拟小振膜的高频通透感。
* **动态压摆 (Compressor)**：2ms 极快起控，压制扫弦毛刺，提升声音紧实度。
* **大教堂混响 (Reverb)**：1.0 最大空间尺寸，营造深邃的包裹感。

### 视频增强算法
* **轻量磨皮 (hqdn3d)**：通过空间平滑参数（5:5:4:4）进行高质量 3D 降噪，产生自然的"柔光"效果。
* **色彩均衡 (eq)**：对比度提升 5%，消除灰蒙感；饱和度提升 15%，增强木纹质感；亮度提升 2%，使画面更加明亮。

## 🚀 快速开始

### 服务端部署
1. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```
   *注意：系统环境变量中需已安装 FFmpeg 4.x 或以上版本。*
2. 启动服务（推荐通过多进程提升并发处理能力）：
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

### 客户端配置
1. 打开 `app.js` 文件。
2. 将 `globalData` 中的 `apiBaseUrl` 修改为已备案并配置 SSL 证书的正式服务器域名。
