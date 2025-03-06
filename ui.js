// import axios from 'axios';
// Sử dụng axios từ global (đã được thêm qua CDN)

// Cấu hình API URLs - thay vì sử dụng biến môi trường
const API_CONFIG = {
    SUI_GAS_FAUCET_URL: 'https://faucet.testnet.sui.io/v1/gas',
    USDC_FAUCET_URL: 'https://faucet.circle.com/api/graphql'
};

// Các biến trạng thái
let isRunning = false;
let shouldStop = false;
let currentAttempt = 0;
let maxAttempts = 1000;
let delaySeconds = 10;
let timerInterval = null;
let startTime = null;
let stats = {
    suiSuccess: 0,
    suiFail: 0,
    usdcSuccess: 0,
    usdcFail: 0,
    completed: 0
};

// DOM Elements
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const clearBtn = document.getElementById('clear-btn');
const walletAddressInput = document.getElementById('wallet-address');
const maxAttemptsInput = document.getElementById('max-attempts');
const delaySecondsInput = document.getElementById('delay-seconds');
const timerElement = document.getElementById('timer');
const logContent = document.getElementById('log-content');
const suiSuccessElement = document.getElementById('sui-success');
const suiFailElement = document.getElementById('sui-fail');
const usdcSuccessElement = document.getElementById('usdc-success');
const usdcFailElement = document.getElementById('usdc-fail');
const completedRunsElement = document.getElementById('completed-runs');
const remainingRunsElement = document.getElementById('remaining-runs');

// Khởi tạo sự kiện
function initEvents() {
    startBtn.addEventListener('click', startProcess);
    stopBtn.addEventListener('click', stopProcess);
    clearBtn.addEventListener('click', clearLogs);
    
    maxAttemptsInput.addEventListener('change', () => {
        maxAttempts = parseInt(maxAttemptsInput.value);
        updateRemainingRuns();
    });
    
    delaySecondsInput.addEventListener('change', () => {
        delaySeconds = parseInt(delaySecondsInput.value);
    });
}

// Hàm bắt đầu quá trình
async function startProcess() {
    if (isRunning) return;
    
    // Lấy giá trị từ input
    const address = walletAddressInput.value.trim();
    maxAttempts = parseInt(maxAttemptsInput.value);
    delaySeconds = parseInt(delaySecondsInput.value);
    
    if (!address) {
        showToast('Lỗi', 'Vui lòng nhập địa chỉ ví SUI', 'error');
        return;
    }
    
    // Cập nhật UI
    isRunning = true;
    shouldStop = false;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    walletAddressInput.disabled = true;
    maxAttemptsInput.disabled = true;
    delaySecondsInput.disabled = true;
    
    // Bắt đầu đếm thời gian
    startTime = new Date();
    timerInterval = setInterval(updateTimer, 1000);
    
    // Hiển thị thông báo
    showToast('Bắt đầu', 'Quá trình yêu cầu faucet đã bắt đầu', 'info');
    addLogEntry('Bắt đầu quá trình yêu cầu faucet', 'info');
    
    // Bắt đầu vòng lặp
    await runWithRetry(address, maxAttempts, delaySeconds);
}

// Hàm dừng quá trình
function stopProcess() {
    if (!isRunning) return;
    
    shouldStop = true;
    stopBtn.disabled = true;
    addLogEntry('Đang dừng quá trình... Vui lòng đợi cho lần thực hiện hiện tại hoàn thành', 'warning');
    showToast('Đang dừng', 'Quá trình sẽ dừng sau khi hoàn thành lần thực hiện hiện tại', 'warning');
}

// Hàm xóa logs
function clearLogs() {
    logContent.innerHTML = '';
    addLogEntry('Logs đã được xóa', 'info');
}

// Hàm sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Hàm chạy với retry
async function runWithRetry(address, maxAttempts, delaySeconds) {
    addLogEntry(`Bắt đầu chạy với ${maxAttempts} lần lặp, mỗi lần cách ${delaySeconds} giây`, 'info');
    
    for (currentAttempt = 1; currentAttempt <= maxAttempts; currentAttempt++) {
        if (shouldStop) {
            addLogEntry('Quá trình đã bị dừng bởi người dùng', 'warning');
            break;
        }
        
        try {
            addLogEntry(`Lần thực hiện thứ ${currentAttempt}/${maxAttempts}`, 'info');
            updateRemainingRuns();
            
            // Yêu cầu SUI Gas
            try {
                const suiResult = await requestSuiGas(address);
                stats.suiSuccess++;
                suiSuccessElement.textContent = stats.suiSuccess;
                addLogEntry(`SUI Gas faucet thành công: ${JSON.stringify(suiResult)}`, 'success');
            } catch (error) {
                stats.suiFail++;
                suiFailElement.textContent = stats.suiFail;
                addLogEntry(`Lỗi yêu cầu SUI Gas: ${error.message}`, 'error');
            }
            
            // Yêu cầu USDC
            try {
                const usdcResult = await requestUSDC(address);
                stats.usdcSuccess++;
                usdcSuccessElement.textContent = stats.usdcSuccess;
                addLogEntry(`USDC faucet thành công: ${JSON.stringify(usdcResult)}`, 'success');
            } catch (error) {
                stats.usdcFail++;
                usdcFailElement.textContent = stats.usdcFail;
                addLogEntry(`Lỗi yêu cầu USDC: ${error.message}`, 'error');
            }
            
            // Cập nhật số lần hoàn thành
            stats.completed++;
            completedRunsElement.textContent = stats.completed;
            
            // Đợi trước lần tiếp theo
            if (currentAttempt < maxAttempts && !shouldStop) {
                addLogEntry(`Đợi ${delaySeconds} giây trước lần tiếp theo...`, 'info');
                await sleep(delaySeconds * 1000);
            }
        } catch (error) {
            addLogEntry(`Lỗi không mong muốn trong lần thứ ${currentAttempt}: ${error.message}`, 'error');
            
            if (currentAttempt < maxAttempts && !shouldStop) {
                addLogEntry(`Đợi ${delaySeconds} giây trước lần tiếp theo...`, 'info');
                await sleep(delaySeconds * 1000);
            }
        }
    }
    
    // Kết thúc quá trình
    finishProcess();
}

// Hàm kết thúc quá trình
function finishProcess() {
    isRunning = false;
    clearInterval(timerInterval);
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
    walletAddressInput.disabled = false;
    maxAttemptsInput.disabled = false;
    delaySecondsInput.disabled = false;
    
    if (shouldStop) {
        showToast('Đã dừng', 'Quá trình đã dừng theo yêu cầu', 'warning');
    } else {
        showToast('Hoàn thành', 'Quá trình yêu cầu faucet đã hoàn thành', 'success');
    }
    
    addLogEntry('Quá trình đã kết thúc', 'info');
}

// Hàm yêu cầu SUI Gas
async function requestSuiGas(address) {
    try {
        const url = API_CONFIG.SUI_GAS_FAUCET_URL;
        const payload = { FixedAmountRequest: { recipient: address } };
        
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        return response.data;
    } catch (error) {
        throw new Error(`Yêu cầu SUI Gas thất bại: ${error.message}`);
    }
}

// Hàm yêu cầu USDC
async function requestUSDC(address) {
    try {
        const url = API_CONFIG.USDC_FAUCET_URL;
        const query = {
            operationName: 'RequestToken',
            variables: {
                input: {
                    destinationAddress: address,
                    token: 'USDC',
                    blockchain: 'SUI'
                }
            },
            query: 'mutation RequestToken($input: RequestTokenInput!) {\n  requestToken(input: $input) {\n    ...RequestTokenResponseInfo\n    __typename\n  }\n}\n\nfragment RequestTokenResponseInfo on RequestTokenResponse {\n  amount\n  blockchain\n  contractAddress\n  currency\n  destinationAddress\n  explorerLink\n  hash\n  status\n  __typename\n}'
        };
        
        const response = await axios.post(url, query, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        return response.data;
    } catch (error) {
        throw new Error(`Yêu cầu USDC thất bại: ${error.message}`);
    }
}

// Hàm cập nhật timer
function updateTimer() {
    if (!startTime) return;
    
    const now = new Date();
    const diff = now - startTime;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    timerElement.textContent = `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
}

// Hàm thêm số 0 phía trước nếu cần
function padZero(num) {
    return num.toString().padStart(2, '0');
}

// Hàm cập nhật số lần còn lại
function updateRemainingRuns() {
    const remaining = maxAttempts - currentAttempt;
    remainingRunsElement.textContent = remaining >= 0 ? remaining : 0;
}

// Hàm thêm log entry
function addLogEntry(message, type = 'info') {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${timestamp}] ${message}`;
    
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
}

// Hàm hiển thị toast
function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fas fa-info-circle';
    if (type === 'success') iconClass = 'fas fa-check-circle';
    if (type === 'error') iconClass = 'fas fa-exclamation-circle';
    if (type === 'warning') iconClass = 'fas fa-exclamation-triangle';
    
    toast.innerHTML = `
        <div class="toast-icon"><i class="${iconClass}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Xử lý nút đóng
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    });
    
    // Tự động đóng sau 5 giây
    setTimeout(() => {
        if (toastContainer.contains(toast)) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }
    }, 5000);
}

// Khởi tạo ứng dụng
function init() {
    initEvents();
    updateRemainingRuns();
    addLogEntry('Ứng dụng đã sẵn sàng', 'info');
}

// Chạy khởi tạo khi trang đã tải xong
document.addEventListener('DOMContentLoaded', init); 