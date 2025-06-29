#!/bin/bash
echo "🚀 WebP转MP4转换器 - 一键安装脚本"
echo "===================================="
echo "✨ 自动检测并安装所有依赖"
echo ""

# 检查并安装依赖
echo "🔍 正在检查依赖..."
./setup-dependencies.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 安装完成！现在可以启动服务了"
    echo ""
    echo "运行以下命令启动:"
    echo "  ./start.sh"
    echo ""
    
    read -p "是否现在启动服务? (y/n): " start_now
    if [ "$start_now" = "y" ] || [ "$start_now" = "Y" ]; then
        echo ""
        echo "�� 正在启动服务..."
        ./start.sh
    fi
else
    echo ""
    echo "❌ 安装过程中出现错误"
    echo "请检查错误信息并重试"
fi
