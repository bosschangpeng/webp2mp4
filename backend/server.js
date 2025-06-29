#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const { URL } = require('url');

const PORT = process.env.PORT || 3001;
const uploadsDir = path.join(__dirname, '../uploads');
const outputDir = path.join(__dirname, '../output');

// 确保目录存在
[uploadsDir, outputDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 存储活动的转换任务
const activeTasks = new Map();

// CORS头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

// 创建HTTP服务器
const server = http.createServer(async (req, res) => {
  // 设置CORS
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  try {
    if (pathname === '/api/upload' && req.method === 'POST') {
      await handleUpload(req, res);
    } else if (pathname === '/api/convert' && req.method === 'POST') {
      await handleConvert(req, res);
    } else if (pathname.startsWith('/api/status/') && req.method === 'GET') {
      const taskId = pathname.split('/').pop();
      await handleStatus(req, res, taskId);
    } else if (pathname.startsWith('/api/download/') && req.method === 'GET') {
      const taskId = pathname.split('/').pop();
      await handleDownload(req, res, taskId);
    } else if (pathname === '/' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', message: 'WebP转MP4转换器运行中' }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '接口不存在' }));
    }
  } catch (error) {
    console.error('服务器错误:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '服务器内部错误' }));
  }
});

// 处理文件上传
async function handleUpload(req, res) {
  try {
    const taskId = Date.now().toString();
    const boundary = getBoundary(req.headers['content-type']);
    
    if (!boundary) {
      throw new Error('无效的Content-Type');
    }

    const fileData = await parseMultipartData(req, boundary);
    
    if (!fileData || !fileData.filename || !fileData.data) {
      throw new Error('未找到有效的WebP文件');
    }

    if (!fileData.filename.toLowerCase().endsWith('.webp')) {
      throw new Error('只支持WebP文件');
    }

    const filename = `${taskId}_${fileData.filename}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, fileData.data);

    const fileInfo = await getWebPInfo(filepath);

    activeTasks.set(taskId, {
      taskId,
      inputPath: filepath,
      filename: fileData.filename,
      fileInfo,
      status: 'uploaded',
      progress: 0,
      createdAt: Date.now()
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      taskId,
      fileInfo
    }));

  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}

// 处理转换请求
async function handleConvert(req, res) {
  try {
    const body = await getRequestBody(req);
    const { taskId, options } = JSON.parse(body);

    const task = activeTasks.get(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    const fps = parseInt(options.fps) || 30;
    const quality = options.quality || 'high';

    const outputFilename = task.filename.replace('.webp', '.mp4');
    const outputPath = path.join(outputDir, `${taskId}_${outputFilename}`);

    task.status = 'converting';
    task.outputPath = outputPath;
    task.options = { fps, quality };

    startConversion(taskId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: '转换已开始' }));

  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}

// 处理状态查询
async function handleStatus(req, res, taskId) {
  const task = activeTasks.get(taskId);
  
  if (!task) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '任务不存在' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    taskId,
    status: task.status,
    progress: task.progress,
    error: task.error
  }));
}

// 处理文件下载
async function handleDownload(req, res, taskId) {
  const task = activeTasks.get(taskId);
  
  if (!task || !task.outputPath || !fs.existsSync(task.outputPath)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '文件不存在' }));
    return;
  }

  const filename = path.basename(task.outputPath);
  const stat = fs.statSync(task.outputPath);

  res.writeHead(200, {
    'Content-Type': 'video/mp4',
    'Content-Length': stat.size,
    'Content-Disposition': `attachment; filename="${filename}"`
  });

  const stream = fs.createReadStream(task.outputPath);
  stream.pipe(res);
}

// 开始转换
function startConversion(taskId) {
  const task = activeTasks.get(taskId);
  if (!task) return;

  const { inputPath, outputPath, options, fileInfo } = task;

  if (fileInfo.isAnimated) {
    const tempDir = path.join(outputDir, `temp_${taskId}`);
    fs.mkdirSync(tempDir, { recursive: true });
    extractFramesAndConvert(taskId, inputPath, outputPath, tempDir, options, fileInfo);
  } else {
    const crf = getQualityCRF(options.quality);
    const ffmpegArgs = [
      '-loop', '1',
      '-i', inputPath,
      '-t', '3',
      '-c:v', 'libx264',
      '-r', options.fps.toString(),
      '-pix_fmt', 'yuv420p',
      '-crf', crf.toString(),
      '-preset', 'slower',
      '-movflags', '+faststart',
      '-y', outputPath
    ];

    runFFmpeg(taskId, ffmpegArgs);
  }
}

// 提取帧并转换（动画WebP）
function extractFramesAndConvert(taskId, inputPath, outputPath, tempDir, options, fileInfo) {
  const task = activeTasks.get(taskId);
  
  const extractCmd = `for i in $(seq 1 ${fileInfo.frames}); do webpmux -get frame $i "${inputPath}" -o "${tempDir}/frame_$(printf "%03d" $i).webp"; done`;
  
  exec(extractCmd, (error, stdout, stderr) => {
    if (error) {
      task.status = 'error';
      task.error = '帧提取失败: ' + error.message;
      return;
    }

    const crf = getQualityCRF(options.quality);
    const originalFps = 16;
    
    const ffmpegArgs = [
      '-r', originalFps.toString(),
      '-i', `${tempDir}/frame_%03d.webp`,
      '-c:v', 'libx264',
      '-r', options.fps.toString(),
      '-pix_fmt', 'yuv420p',
      '-crf', crf.toString(),
      '-preset', 'slower',
      '-tune', 'animation',
      '-movflags', '+faststart',
      '-y', outputPath
    ];

    runFFmpeg(taskId, ffmpegArgs, () => {
      setTimeout(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }, 5000);
    });
  });
}

// 运行FFmpeg
function runFFmpeg(taskId, args, callback) {
  const task = activeTasks.get(taskId);
  if (!task) return;

  const ffmpeg = spawn('ffmpeg', args);
  let duration = 0;

  ffmpeg.stderr.on('data', (data) => {
    const output = data.toString();
    
    const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
    if (durationMatch) {
      duration = parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseInt(durationMatch[3]);
    }

    const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})/);
    if (timeMatch && duration > 0) {
      const currentTime = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]);
      task.progress = Math.min(Math.round((currentTime / duration) * 100), 99);
    }
  });

  ffmpeg.on('close', (code) => {
    if (code === 0) {
      task.status = 'completed';
      task.progress = 100;
      if (callback) callback();
    } else {
      task.status = 'error';
      task.error = 'FFmpeg转换失败';
    }
  });

  ffmpeg.on('error', (error) => {
    task.status = 'error';
    task.error = error.message;
  });
}

// 工具函数
function getBoundary(contentType) {
  if (!contentType) return null;
  const match = contentType.match(/boundary=(.+)$/);
  return match ? match[1] : null;
}

async function parseMultipartData(req, boundary) {
  const chunks = [];
  
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  
  const buffer = Buffer.concat(chunks);
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  
  const parts = [];
  let start = 0;
  
  while (true) {
    const boundaryIndex = buffer.indexOf(boundaryBuffer, start);
    if (boundaryIndex === -1) break;
    
    if (start > 0) {
      parts.push(buffer.slice(start, boundaryIndex));
    }
    
    start = boundaryIndex + boundaryBuffer.length;
  }
  
  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    
    const headers = part.slice(0, headerEnd).toString();
    const data = part.slice(headerEnd + 4, part.length - 2);
    
    if (headers.includes('filename=')) {
      const filenameMatch = headers.match(/filename="([^"]+)"/);
      if (filenameMatch) {
        return {
          filename: filenameMatch[1],
          data: data
        };
      }
    }
  }
  
  return null;
}

async function getRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString();
}

async function getWebPInfo(filepath) {
  return new Promise((resolve) => {
    exec(`webpmux -info "${filepath}"`, (error, stdout, stderr) => {
      if (error) {
        resolve({
          width: 0,
          height: 0,
          isAnimated: false,
          frames: 1
        });
        return;
      }

      const lines = stdout.split('\n');
      const canvasLine = lines.find(line => line.includes('Canvas size:'));
      const framesLine = lines.find(line => line.includes('Number of frames:'));
      
      let width = 0, height = 0, frames = 1;
      
      if (canvasLine) {
        const match = canvasLine.match(/Canvas size: (\d+) x (\d+)/);
        if (match) {
          width = parseInt(match[1]);
          height = parseInt(match[2]);
        }
      }
      
      if (framesLine) {
        const match = framesLine.match(/Number of frames: (\d+)/);
        if (match) {
          frames = parseInt(match[1]);
        }
      }

      resolve({
        width,
        height,
        isAnimated: frames > 1,
        frames
      });
    });
  });
}

function getQualityCRF(quality) {
  switch (quality) {
    case 'low': return 20;
    case 'medium': return 15;
    case 'high': return 10;
    default: return 15;
  }
}

// 定期清理过期文件
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000;

  for (const [taskId, task] of activeTasks) {
    if (now - task.createdAt > maxAge) {
      if (task.inputPath && fs.existsSync(task.inputPath)) {
        fs.unlinkSync(task.inputPath);
      }
      if (task.outputPath && fs.existsSync(task.outputPath)) {
        fs.unlinkSync(task.outputPath);
      }
      activeTasks.delete(taskId);
    }
  }
}, 60 * 60 * 1000);

// 启动服务器
server.listen(PORT, () => {
  console.log(`🚀 WebP转MP4转换器运行在端口 ${PORT}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});
