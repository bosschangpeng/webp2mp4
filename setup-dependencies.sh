#!/bin/bash

echo "🔧 WebP转MP4转换器 - 依赖自动安装工具"
echo "========================================"
echo ""

# 创建依赖目录
DEPS_DIR="$(pwd)/dependencies"
mkdir -p "$DEPS_DIR"

# 检测操作系统
OS=""
case "$(uname -s)" in
    Darwin*)    OS="macos" ;;
    Linux*)     OS="linux" ;;
    *)          OS="unknown" ;;
esac

echo "🖥️  检测到系统: $OS"
echo ""

# 检查Node.js
check_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 14 ]; then
            echo "✅ Node.js 已安装: $(node -v)"
            return 0
        else
            echo "⚠️  Node.js 版本过低: $(node -v) (需要 v14+)"
            return 1
        fi
    else
        echo "❌ Node.js 未安装"
        return 1
    fi
}

# 检查FFmpeg
check_ffmpeg() {
    if command -v ffmpeg &> /dev/null; then
        echo "✅ FFmpeg 已安装"
        return 0
    elif [ -f "$DEPS_DIR/ffmpeg/ffmpeg" ] || [ -f "$DEPS_DIR/ffmpeg/bin/ffmpeg" ]; then
        echo "✅ FFmpeg 已下载到本地"
        return 0
    else
        echo "❌ FFmpeg 未安装"
        return 1
    fi
}

# 检查WebP工具
check_webp() {
    if command -v webpmux &> /dev/null; then
        echo "✅ WebP工具 已安装"
        return 0
    elif [ -f "$DEPS_DIR/webp/bin/webpmux" ]; then
        echo "✅ WebP工具 已下载到本地"
        return 0
    else
        echo "❌ WebP工具 未安装"
        return 1
    fi
}

# 选择下载源
choose_mirror() {
    echo ""
    echo "🌐 请选择下载源:"
    echo "1) 官方源 (国际网络)"
    echo "2) 中国镜像源 (国内网络)"
    echo ""
    read -p "请输入选择 (1 或 2): " choice
    
    case $choice in
        1) echo "official" ;;
        2) echo "china" ;;
        *) echo "official" ;;
    esac
}

# 下载FFmpeg
download_ffmpeg() {
    local mirror=$1
    echo ""
    echo "📥 正在下载 FFmpeg..."
    
    local url=""
    local filename=""
    
    if [ "$mirror" = "china" ]; then
        case "$OS" in
            "macos")
                url="https://mirror.ghproxy.com/https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-macos64-gpl.zip"
                filename="ffmpeg-macos.zip"
                ;;
            "linux")
                url="https://mirror.ghproxy.com/https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz"
                filename="ffmpeg-linux.tar.xz"
                ;;
        esac
    else
        case "$OS" in
            "macos")
                url="https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-macos64-gpl.zip"
                filename="ffmpeg-macos.zip"
                ;;
            "linux")
                url="https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz"
                filename="ffmpeg-linux.tar.xz"
                ;;
        esac
    fi
    
    if [ -z "$url" ]; then
        echo "❌ 不支持的操作系统: $OS"
        return 1
    fi
    
    echo "   下载地址: $url"
    
    # 下载文件
    if command -v curl &> /dev/null; then
        curl -L -o "$DEPS_DIR/$filename" "$url"
    elif command -v wget &> /dev/null; then
        wget -O "$DEPS_DIR/$filename" "$url"
    else
        echo "❌ 需要 curl 或 wget 来下载文件"
        return 1
    fi
    
    if [ $? -ne 0 ]; then
        echo "❌ 下载失败"
        return 1
    fi
    
    echo "✅ 下载完成，正在解压..."
    
    # 解压文件
    cd "$DEPS_DIR"
    case "$filename" in
        *.zip)
            if command -v unzip &> /dev/null; then
                unzip -q "$filename"
                find . -name "ffmpeg*" -type d | head -1 | xargs -I {} mv {} ffmpeg
            else
                echo "❌ 需要 unzip 来解压文件"
                return 1
            fi
            ;;
        *.tar.xz)
            if command -v tar &> /dev/null; then
                tar -xf "$filename"
                find . -name "ffmpeg*" -type d | head -1 | xargs -I {} mv {} ffmpeg
            else
                echo "❌ 需要 tar 来解压文件"
                return 1
            fi
            ;;
    esac
    
    rm -f "$filename"
    cd - > /dev/null
    
    echo "✅ FFmpeg 安装完成"
    return 0
}

# 下载WebP工具
download_webp() {
    local mirror=$1
    echo ""
    echo "📥 正在下载 WebP工具..."
    
    local url=""
    local filename=""
    
    if [ "$mirror" = "china" ]; then
        case "$OS" in
            "macos")
                url="https://mirror.ghproxy.com/https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.3.2-mac-x86-64.tar.gz"
                filename="webp-macos.tar.gz"
                ;;
            "linux")
                url="https://mirror.ghproxy.com/https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.3.2-linux-x86-64.tar.gz"
                filename="webp-linux.tar.gz"
                ;;
        esac
    else
        case "$OS" in
            "macos")
                url="https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.3.2-mac-x86-64.tar.gz"
                filename="webp-macos.tar.gz"
                ;;
            "linux")
                url="https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.3.2-linux-x86-64.tar.gz"
                filename="webp-linux.tar.gz"
                ;;
        esac
    fi
    
    if [ -z "$url" ]; then
        echo "❌ 不支持的操作系统: $OS"
        return 1
    fi
    
    echo "   下载地址: $url"
    
    # 下载文件
    if command -v curl &> /dev/null; then
        curl -L -o "$DEPS_DIR/$filename" "$url"
    elif command -v wget &> /dev/null; then
        wget -O "$DEPS_DIR/$filename" "$url"
    else
        echo "❌ 需要 curl 或 wget 来下载文件"
        return 1
    fi
    
    if [ $? -ne 0 ]; then
        echo "❌ 下载失败"
        return 1
    fi
    
    echo "✅ 下载完成，正在解压..."
    
    # 解压文件
    cd "$DEPS_DIR"
    case "$filename" in
        *.tar.gz)
            if command -v tar &> /dev/null; then
                tar -xzf "$filename"
                find . -name "libwebp*" -type d | head -1 | xargs -I {} mv {} webp
            else
                echo "❌ 需要 tar 来解压文件"
                return 1
            fi
            ;;
    esac
    
    rm -f "$filename"
    cd - > /dev/null
    
    echo "✅ WebP工具 安装完成"
    return 0
}

# 主程序
main() {
    echo "🔍 正在检查依赖..."
    echo ""
    
    local need_nodejs=false
    local need_ffmpeg=false
    local need_webp=false
    
    # 检查所有依赖
    if ! check_nodejs; then
        need_nodejs=true
    fi
    
    if ! check_ffmpeg; then
        need_ffmpeg=true
    fi
    
    if ! check_webp; then
        need_webp=true
    fi
    
    # 如果所有依赖都已安装
    if [ "$need_nodejs" = false ] && [ "$need_ffmpeg" = false ] && [ "$need_webp" = false ]; then
        echo ""
        echo "🎉 所有依赖都已安装，可以直接使用！"
        echo ""
        echo "运行以下命令启动服务:"
        echo "  ./start.sh"
        return 0
    fi
    
    echo ""
    echo "📋 需要安装的依赖:"
    [ "$need_nodejs" = true ] && echo "   - Node.js (请手动安装: https://nodejs.org/)"
    [ "$need_ffmpeg" = true ] && echo "   - FFmpeg"
    [ "$need_webp" = true ] && echo "   - WebP工具"
    echo ""
    
    # Node.js需要手动安装
    if [ "$need_nodejs" = true ]; then
        echo "⚠️  Node.js 需要手动安装:"
        echo "   1. 访问 https://nodejs.org/"
        echo "   2. 下载并安装 LTS 版本"
        echo "   3. 重新运行此脚本"
        echo ""
        read -p "按回车键继续安装其他依赖..."
    fi
    
    # 自动安装FFmpeg和WebP工具
    if [ "$need_ffmpeg" = true ] || [ "$need_webp" = true ]; then
        local mirror=$(choose_mirror)
        echo ""
        echo "🚀 开始自动安装依赖 (使用 $mirror 源)..."
        
        if [ "$need_ffmpeg" = true ]; then
            download_ffmpeg "$mirror"
        fi
        
        if [ "$need_webp" = true ]; then
            download_webp "$mirror"
        fi
        
        echo ""
        echo "🎉 依赖安装完成！"
        echo ""
        echo "运行以下命令启动服务:"
        echo "  ./start.sh"
    fi
}

# 运行主程序
main
