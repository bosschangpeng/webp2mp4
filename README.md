# 🎬 WebP转MP4转换器

一个高质量的WebP到MP4转换工具，特别针对动画WebP优化，支持完整动画序列转换。

## ⚡ 真正的即开即用

**🎉 自动依赖管理，无需手动安装！** 完美适合GitHub分发。

### 🚀 超简单使用

```bash
# 1. 下载项目
git clone https://github.com/your-username/webp2mp4.git
cd webp2mp4

# 2. 一键安装 (自动下载所有依赖)
./install.sh        # macOS/Linux
install.bat         # Windows (双击即可)

# 3. 自动启动，开始使用！
```

**就这么简单！** 浏览器会自动打开 http://localhost:3000

## ✨ 核心特性

- 🎬 **完整动画支持**: 保留动画WebP的所有帧，转换为完整的MP4视频
- 🖼️ **静态图片支持**: 将静态WebP转换为3秒循环视频  
- 🎯 **自动优化**: 自动保持原始尺寸和时长，无需手动设置
- 🔧 **高质量编码**: 使用H.264编码，针对动画优化
- ⚡ **零依赖**: 纯Node.js实现，无需npm install
- 🤖 **自动依赖管理**: 自动下载FFmpeg和WebP工具
- 🌐 **双源下载**: 支持官方源和中国镜像源
- 📱 **现代界面**: 拖拽上传，实时进度，响应式设计

## 🛠️ 系统要求

### 必需软件 (自动安装)

#### 1. Node.js (v14+) - 需要手动安装
- **下载**: [nodejs.org](https://nodejs.org/)
- **安装方式**:
  - macOS: `brew install node`
  - Ubuntu: `sudo apt install nodejs`
  - Windows: 下载安装包

#### 2. FFmpeg - 自动下载 ✨
- ✅ **自动下载**: 脚本会自动下载适合您系统的FFmpeg
- ✅ **本地安装**: 下载到项目目录，不影响系统
- ✅ **双源选择**: 官方源或中国镜像源

#### 3. WebP工具 - 自动下载 ✨
- ✅ **自动下载**: 脚本会自动下载WebP工具包
- ✅ **本地安装**: 下载到项目目录，不影响系统
- ✅ **双源选择**: 官方源或中国镜像源

## 🎯 安装方式对比

| 方式 | 手动安装 | 自动安装 |
|------|----------|----------|
| **Node.js** | ✅ 需要 | ✅ 需要 |
| **FFmpeg** | ❌ 需要 | ✅ 自动 |
| **WebP工具** | ❌ 需要 | ✅ 自动 |
| **安装时间** | 10-30分钟 | **2-5分钟** |
| **技术要求** | 中等 | **零基础** |

## 📖 使用说明

### 基本操作流程

1. **📁 选择文件**: 点击上传区域选择WebP文件或拖拽文件
2. **ℹ️ 查看信息**: 系统自动显示文件尺寸、帧数、类型
3. **⚙️ 设置选项**: 选择帧率(24/30/60)和质量(标准/高/最高)
4. **🚀 开始转换**: 点击"开始转换"按钮，实时显示进度
5. **💾 下载文件**: 转换完成后点击下载MP4文件

### 下载源选择

安装时会提示选择下载源：

**1. 官方源 (国际网络)**
- GitHub Releases
- Google Storage
- 速度较慢但稳定

**2. 中国镜像源 (国内网络)**
- GitHub代理镜像
- 国内CDN加速
- 速度更快

## 📁 项目结构

```
webp2mp4/
├── 📄 README.md                    # 项目说明文档
├── 🚀 install.sh                   # 一键安装脚本 (Linux/macOS)
├── 🚀 install.bat                  # 一键安装脚本 (Windows)
├── 🔧 setup-dependencies.sh        # 依赖安装脚本 (Linux/macOS)
├── 🔧 setup-dependencies.bat       # 依赖安装脚本 (Windows)
├── 🚀 start.sh                     # 启动脚本 (Linux/macOS)
├── 🚀 start.bat                    # 启动脚本 (Windows)
├── 📁 backend/                     # 零依赖后端
│   └── server.js                  # 纯Node.js服务器
├── 📁 frontend/                    # 零依赖前端
│   ├── index.html                 # 主页面
│   └── app.js                     # 纯JavaScript逻辑
├── 📁 dependencies/                # 自动下载的依赖 (自动创建)
│   ├── ffmpeg/                    # FFmpeg可执行文件
│   └── webp/                      # WebP工具
├── 📁 uploads/                     # 上传文件目录
└── 📁 output/                      # 输出文件目录
```

## 🐛 故障排除

### 常见问题及解决方案

#### ❌ "未找到Node.js"
```bash
# 检查是否安装
node --version

# 安装方法
# macOS
brew install node

# Ubuntu
sudo apt install nodejs

# Windows
# 从 https://nodejs.org/ 下载安装
```

#### ❌ "依赖下载失败"
1. **检查网络连接**
2. **尝试不同的下载源**:
   - 重新运行 `./setup-dependencies.sh`
   - 选择不同的镜像源
3. **手动下载**:
   - 访问项目GitHub页面查看手动安装说明

#### ❌ "权限错误"
```bash
# 给脚本添加执行权限
chmod +x install.sh setup-dependencies.sh start.sh
```

## 🎯 适用场景

✅ **个人使用**: 转换动画表情包、图片等
✅ **开发者工具**: 集成到其他项目中
✅ **教学演示**: 代码简洁，易于理解
✅ **离线使用**: 无网络依赖，本地运行
✅ **GitHub分发**: 下载即用，自动安装依赖

## 📄 许可证

MIT License - 自由使用、修改和分发

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

**⭐ 如果这个项目对您有帮助，请给个Star！**


