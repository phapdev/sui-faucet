// const axios = require('axios');
import axios from 'axios';

// Cấu hình API URLs - thay vì sử dụng biến môi trường
const API_CONFIG = {
    SUI_GAS_FAUCET_URL: 'https://faucet.testnet.sui.io/v1/gas',
    USDC_FAUCET_URL: 'https://faucet.circle.com/api/graphql'
};

async function requestSuiGas(address) {
    try {
        const url = API_CONFIG.SUI_GAS_FAUCET_URL;
        const payload = { FixedAmountRequest: { recipient: address } };
        
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] SUI Gas faucet response:`, JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        throw new Error(`Failed to request SUI gas: ${error.message}`);
    }
}

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
        
        console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] USDC faucet response:`, JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        throw new Error(`Failed to request USDC: ${error.message}`);
    }
}

async function main() {
    const address = '0xe0c4700d3e6de95283cfafb2f292ce34eaadab7a56470d0bfcdd0df3a0dbb002';
    
    try {
        await requestSuiGas(address);
    } catch (error) {
        console.error(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Error requesting SUI gas:`, error.message);
    }
    
    try {
        await requestUSDC(address);
    } catch (error) {
        console.error(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Error requesting USDC:`, error.message);
    }
}

// Hàm sleep để tạm dừng thực thi
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Hàm chạy lặp lại với số lần và thời gian delay
async function runWithRetry(maxAttempts = 1000, delaySeconds = 10) {
    console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Bắt đầu chạy với ${maxAttempts} lần lặp, mỗi lần cách ${delaySeconds} giây`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Lần thực hiện thứ ${attempt}/${maxAttempts}`);
            
            await main();
            
            if (attempt < maxAttempts) {
                console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Đợi ${delaySeconds} giây trước lần tiếp theo...`);
                await sleep(delaySeconds * 1000);
            }
        } catch (error) {
            console.error(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Lỗi không mong muốn trong lần thứ ${attempt}: ${error.message}`);
            
            // Vẫn tiếp tục vòng lặp dù có lỗi
            if (attempt < maxAttempts) {
                console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Đợi ${delaySeconds} giây trước lần tiếp theo...`);
                await sleep(delaySeconds * 1000);
            }
        }
    }
    
    console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Hoàn thành ${maxAttempts} lần thực hiện`);
}

// Xuất các hàm để sử dụng trong UI
export { requestSuiGas, requestUSDC, sleep, main, runWithRetry };

// Nếu chạy trực tiếp từ dòng lệnh
if (import.meta.url === `file://${process.argv[1]}`) {
    // Chạy hàm với 1000 lần lặp, mỗi lần cách 10 giây
    runWithRetry(1000, 10).catch(error => {
        console.error(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] Lỗi nghiêm trọng: ${error.message}`);
        process.exit(1);
    });
}
