@echo off
chcp 65001 >nul
title WebP转MP4转换器 - 依赖自动安装工具

echo 🔧 WebP转MP4转换器 - 依赖自动安装工具
echo ========================================
echo.

REM 创建依赖目录
set DEPS_DIR=%cd%\dependencies
if not exist "%DEPS_DIR%" mkdir "%DEPS_DIR%"

echo 🖥️  检测到系统: Windows
echo.

REM 检查Node.js
:check_nodejs
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装
    set need_nodejs=true
) else (
    for /f "tokens=1 delims=." %%a in ('node -v') do set NODE_MAJOR=%%a
    set NODE_MAJOR=%NODE_MAJOR:v=%
    if %NODE_MAJOR% LSS 14 (
        echo ⚠️  Node.js 版本过低，需要 v14+
        set need_nodejs=true
    ) else (
        echo ✅ Node.js 已安装: 
        node -v
        set need_nodejs=false
    )
)

REM 检查FFmpeg
:check_ffmpeg
ffmpeg -version >nul 2>&1
if errorlevel 1 (
    if exist "%DEPS_DIR%\ffmpeg\bin\ffmpeg.exe" (
        echo ✅ FFmpeg 已下载到本地
        set need_ffmpeg=false
    ) else (
        echo ❌ FFmpeg 未安装
        set need_ffmpeg=true
    )
) else (
    echo ✅ FFmpeg 已安装
    set need_ffmpeg=false
)

REM 检查WebP工具
:check_webp
webpmux -version >nul 2>&1
if errorlevel 1 (
    if exist "%DEPS_DIR%\webp\bin\webpmux.exe" (
        echo ✅ WebP工具 已下载到本地
        set need_webp=false
    ) else (
        echo ❌ WebP工具 未安装
        set need_webp=true
    )
) else (
    echo ✅ WebP工具 已安装
    set need_webp=false
)

REM 检查是否需要安装依赖
if "%need_nodejs%"=="false" if "%need_ffmpeg%"=="false" if "%need_webp%"=="false" (
    echo.
    echo 🎉 所有依赖都已安装，可以直接使用！
    echo.
    echo 运行以下命令启动服务:
    echo   start.bat
    echo.
    pause
    exit /b 0
)

echo.
echo 📋 需要安装的依赖:
if "%need_nodejs%"=="true" echo    - Node.js (请手动安装: https://nodejs.org/)
if "%need_ffmpeg%"=="true" echo    - FFmpeg
if "%need_webp%"=="true" echo    - WebP工具
echo.

REM Node.js需要手动安装
if "%need_nodejs%"=="true" (
    echo ⚠️  Node.js 需要手动安装:
    echo    1. 访问 https://nodejs.org/
    echo    2. 下载并安装 LTS 版本
    echo    3. 重新运行此脚本
    echo.
    pause
)

REM 选择下载源
if "%need_ffmpeg%"=="true" (
    goto :choose_mirror
)
if "%need_webp%"=="true" (
    goto :choose_mirror
)
goto :end

:choose_mirror
echo 🌐 请选择下载源:
echo 1) 官方源 (国际网络)
echo 2) 中国镜像源 (国内网络)
echo.
set /p choice=请输入选择 (1 或 2): 

if "%choice%"=="2" (
    set mirror=china
    echo 使用中国镜像源
) else (
    set mirror=official
    echo 使用官方源
)

echo.
echo 🚀 开始自动安装依赖...

REM 下载FFmpeg
if "%need_ffmpeg%"=="true" (
    echo.
    echo 📥 正在下载 FFmpeg...
    
    if "%mirror%"=="china" (
        set ffmpeg_url=https://mirror.ghproxy.com/https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip
    ) else (
        set ffmpeg_url=https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip
    )
    
    echo    下载地址: %ffmpeg_url%
    
    REM 使用PowerShell下载
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%ffmpeg_url%' -OutFile '%DEPS_DIR%\ffmpeg.zip'}"
    
    if errorlevel 1 (
        echo ❌ FFmpeg 下载失败
    ) else (
        echo ✅ 下载完成，正在解压...
        
        REM 解压FFmpeg
        powershell -Command "& {Expand-Archive -Path '%DEPS_DIR%\ffmpeg.zip' -DestinationPath '%DEPS_DIR%\temp' -Force}"
        
        REM 移动文件到正确位置
        for /d %%i in ("%DEPS_DIR%\temp\ffmpeg*") do (
            move "%%i" "%DEPS_DIR%\ffmpeg" >nul 2>&1
        )
        
        REM 清理临时文件
        rmdir /s /q "%DEPS_DIR%\temp" >nul 2>&1
        del "%DEPS_DIR%\ffmpeg.zip" >nul 2>&1
        
        echo ✅ FFmpeg 安装完成
    )
)

REM 下载WebP工具
if "%need_webp%"=="true" (
    echo.
    echo 📥 正在下载 WebP工具...
    
    if "%mirror%"=="china" (
        set webp_url=https://mirror.ghproxy.com/https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.3.2-windows-x64.zip
    ) else (
        set webp_url=https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.3.2-windows-x64.zip
    )
    
    echo    下载地址: %webp_url%
    
    REM 使用PowerShell下载
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%webp_url%' -OutFile '%DEPS_DIR%\webp.zip'}"
    
    if errorlevel 1 (
        echo ❌ WebP工具 下载失败
    ) else (
        echo ✅ 下载完成，正在解压...
        
        REM 解压WebP工具
        powershell -Command "& {Expand-Archive -Path '%DEPS_DIR%\webp.zip' -DestinationPath '%DEPS_DIR%\temp' -Force}"
        
        REM 移动文件到正确位置
        for /d %%i in ("%DEPS_DIR%\temp\libwebp*") do (
            move "%%i" "%DEPS_DIR%\webp" >nul 2>&1
        )
        
        REM 清理临时文件
        rmdir /s /q "%DEPS_DIR%\temp" >nul 2>&1
        del "%DEPS_DIR%\webp.zip" >nul 2>&1
        
        echo ✅ WebP工具 安装完成
    )
)

echo.
echo 🎉 依赖安装完成！
echo.
echo 运行以下命令启动服务:
echo   start.bat

:end
echo.
pause
