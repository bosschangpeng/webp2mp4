const API_BASE = 'http://localhost:3001/api';

let selectedFile = null;
let taskId = null;
let isConverting = false;

const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileDetails = document.getElementById('fileDetails');
const convertBtn = document.getElementById('convertBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const downloadSection = document.getElementById('downloadSection');
const downloadBtn = document.getElementById('downloadBtn');
const logsSection = document.getElementById('logsSection');
const logs = document.getElementById('logs');
const uploadArea = document.querySelector('.upload-area');

document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    addLog('WebP转MP4转换器已就绪 - 零依赖版本');
});

function setupEventListeners() {
    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    convertBtn.addEventListener('click', startConversion);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp')) {
            fileInput.files = files;
            processFile(file);
        } else {
            alert('请选择WebP文件');
        }
    }
}

async function processFile(file) {
    if (!file.type.includes('webp') && !file.name.toLowerCase().endsWith('.webp')) {
        alert('请选择WebP文件');
        return;
    }

    selectedFile = file;
    addLog(`选择文件: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    fileDetails.innerHTML = `
        <p><strong>文件名:</strong> ${file.name}</p>
        <p><strong>大小:</strong> ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
        <p><strong>类型:</strong> ${file.type || 'image/webp'}</p>
    `;
    fileInfo.style.display = 'block';
    
    convertBtn.disabled = false;
    convertBtn.textContent = '开始转换';
    
    await uploadFile();
}

async function uploadFile() {
    try {
        const formData = new FormData();
        formData.append('webpFile', selectedFile);

        addLog('正在上传文件...');
        
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            taskId = data.taskId;
            addLog(`文件上传成功，任务ID: ${taskId}`);
            
            if (data.fileInfo) {
                let infoHtml = `
                    <p><strong>文件名:</strong> ${selectedFile.name}</p>
                    <p><strong>大小:</strong> ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p><strong>尺寸:</strong> ${data.fileInfo.width}x${data.fileInfo.height}</p>
                    <p><strong>类型:</strong> ${data.fileInfo.isAnimated ? '动画WebP' : '静态WebP'}</p>
                `;
                
                if (data.fileInfo.isAnimated && data.fileInfo.frames) {
                    infoHtml += `<p><strong>帧数:</strong> ${data.fileInfo.frames}帧</p>`;
                    infoHtml += `<p><strong>预计时长:</strong> ${((data.fileInfo.frames * 62) / 1000).toFixed(2)}秒</p>`;
                }
                
                fileDetails.innerHTML = infoHtml;
                
                if (data.fileInfo.isAnimated) {
                    addLog(`检测到动画WebP: ${data.fileInfo.width}x${data.fileInfo.height}, ${data.fileInfo.frames}帧`);
                } else {
                    addLog(`检测到静态WebP: ${data.fileInfo.width}x${data.fileInfo.height}`);
                }
            }
        } else {
            throw new Error(data.error || '上传失败');
        }
    } catch (error) {
        addLog(`上传失败: ${error.message}`);
        alert(`文件上传失败: ${error.message}`);
    }
}

async function startConversion() {
    if (!taskId) {
        alert('请先选择文件');
        return;
    }

    try {
        isConverting = true;
        convertBtn.disabled = true;
        convertBtn.textContent = '转换中...';
        
        progressSection.style.display = 'block';
        logsSection.style.display = 'block';
        
        const fps = document.getElementById('fps').value;
        const quality = document.getElementById('quality').value;
        
        addLog(`发送转换请求，参数: 帧率=${fps}, 质量=${quality}`);

        const response = await fetch(`${API_BASE}/convert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                taskId: taskId,
                options: {
                    fps: parseInt(fps),
                    quality: quality
                }
            })
        });

        const data = await response.json();

        if (data.success) {
            addLog('转换请求已发送，开始监控进度...');
            monitorProgress();
        } else {
            throw new Error(data.error || '转换请求失败');
        }
    } catch (error) {
        addLog(`转换失败: ${error.message}`);
        alert(`转换失败: ${error.message}`);
        resetConversionState();
    }
}

async function monitorProgress() {
    const checkProgress = async () => {
        try {
            const response = await fetch(`${API_BASE}/status/${taskId}`);
            const status = await response.json();

            progressFill.style.width = `${status.progress}%`;
            progressText.textContent = `${status.status}: ${status.progress}%`;

            addLog(`转换进度: ${status.progress}% - ${status.status}`);

            if (status.status === 'completed') {
                addLog('✅ 转换完成！');
                showDownloadSection();
                return;
            } else if (status.status === 'error') {
                throw new Error(status.error || '转换失败');
            }

            setTimeout(checkProgress, 1000);
        } catch (error) {
            addLog(`状态检查失败: ${error.message}`);
            alert(`获取转换状态失败: ${error.message}`);
            resetConversionState();
        }
    };

    checkProgress();
}

function showDownloadSection() {
    progressSection.style.display = 'none';
    downloadSection.style.display = 'block';
    
    downloadBtn.href = `${API_BASE}/download/${taskId}`;
    downloadBtn.download = selectedFile.name.replace('.webp', '.mp4');
    
    resetConversionState();
}

function resetConversionState() {
    isConverting = false;
    convertBtn.disabled = false;
    convertBtn.textContent = '开始转换';
}

function resetForm() {
    selectedFile = null;
    taskId = null;
    isConverting = false;
    
    fileInput.value = '';
    fileInfo.style.display = 'none';
    progressSection.style.display = 'none';
    downloadSection.style.display = 'none';
    logsSection.style.display = 'none';
    
    convertBtn.disabled = true;
    convertBtn.textContent = '选择文件后开始转换';
    
    logs.innerHTML = '';
    
    addLog('表单已重置，准备处理新文件');
}

function addLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = `[${timestamp}] ${message}`;
    logs.appendChild(logEntry);
    logs.scrollTop = logs.scrollHeight;
}
