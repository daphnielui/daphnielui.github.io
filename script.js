// 全局變量
let waterAmount = 0;
let foodClassifier;
let poseDetector;

// 顯示功能按鈕
// 飲食和運動建議
const dietSuggestions = [
    "早餐建議：全麥吐司配蛋白質（雞蛋或優格）",
    "午餐建議：均衡的蔬菜和瘦肉",
    "晚餐建議：清淡且富含蛋白質的餐點"
];

const exerciseSuggestions = [
    "建議進行30分鐘有氧運動",
    "進行基礎重訓鍛煉",
    "記得做伸展運動"
];

function showFeatures() {
    const homeSection = document.querySelector('#home');
    const featuresHTML = `
        <div class="feature-container">
            <button class="back-btn" onclick="backToHome()">回到首頁</button>
            <div class="feature-buttons">
                <button class="feature-btn" onclick="navigateToPage('plan')">今日計劃</button>
                <button class="feature-btn" onclick="navigateToPage('food')">食物分析</button>
                <button class="feature-btn" onclick="navigateToPage('exercise')">運動檢測分析</button>
                <button class="feature-btn" onclick="navigateToPage('water')">飲水量</button>
            </div>
        </div>
    `;
    homeSection.innerHTML = featuresHTML;

    // 更新今日計劃的建議
    const dietContainer = document.getElementById('diet-suggestions');
    const exerciseContainer = document.getElementById('exercise-suggestions');
    
    if (dietContainer) {
        dietContainer.innerHTML = dietSuggestions.map(suggestion => 
            `<p>• ${suggestion}</p>`
        ).join('');
    }
    
    if (exerciseContainer) {
        exerciseContainer.innerHTML = exerciseSuggestions.map(suggestion => 
            `<p>• ${suggestion}</p>`
        ).join('');
    }
}

// 頁面導航
function navigateToPage(pageId) {
    document.querySelectorAll(".page").forEach((page) => {
        page.classList.remove("active");
    });
    document.getElementById(pageId).classList.add("active");

    // 初始化攝像頭（進入對應頁面時）
    if (pageId === "food") initFoodCamera();
    if (pageId === "exercise") initExerciseCamera();
}

// 回到首頁
function backToHome() {
    document.querySelector('#home').innerHTML = `
        <div class="welcome-container">
            <img src="AI減脂好夥伴.png" alt="AI減脂好夥伴" class="hero-image" onclick="showFeatures()">
            <div id="welcome-message" class="welcome-message"></div>
        </div>
    `;
    navigateToPage('home');
}

// ================= 飲水功能 =================
document.getElementById("add-water").addEventListener("click", () => addWater(200));
document.getElementById("quickAddWater").addEventListener("click", () => addWater(200));

function addWater(ml) {
    waterAmount += ml;
    updateWaterUI();
    if (waterAmount >= 2000) {
        document.getElementById("waterAchievement").style.display = "block";
        setTimeout(() => {
            document.getElementById("waterAchievement").style.display = "none";
        }, 3000);
    }
}

function updateWaterUI() {
    document.getElementById("water-amount").textContent = `今日飲水量: ${waterAmount}ml`;
    document.getElementById("water-level").style.height = `${Math.min(100, (waterAmount / 2000) * 100)}%`;
}

// ================= 食物分析 =================
async function initFoodCamera() {
    const video = document.getElementById("camera");
    const canvas = document.getElementById("output");
    const ctx = canvas.getContext("2d");

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        };

        document.getElementById("capture").addEventListener("click", () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            analyzeFood(canvas);
        });
    } catch (err) {
        console.error("攝像頭錯誤:", err);
        alert("無法訪問攝像頭，請確保已授予權限！");
    }
}

async function analyzeFood(canvas) {
    if (!foodClassifier) {
        const vision = await VisionTasks.FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        foodClassifier = await VisionTasks.ImageClassifier.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_classifier/food_classifier/float32/1/food_classifier.tflite",
            },
            maxResults: 3,
        });
    }

    const result = foodClassifier.classify(canvas);
    displayFoodResult(result);
}

function displayFoodResult(result) {
    const resultContainer = document.getElementById("analysis-result");
    resultContainer.innerHTML = "<h3>食物分析結果：</h3>";
    result.classifications[0].categories.forEach(category => {
        resultContainer.innerHTML += `<p>${category.categoryName} (${Math.round(category.score * 100)}%)</p>`;
    });
}

// ================= 運動檢測 =================
async function initExerciseCamera() {
    const video = document.getElementById("exercise-camera");
    const canvas = document.getElementById("pose-output");
    const ctx = canvas.getContext("2d");

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        };

        document.getElementById("start-exercise").addEventListener("click", () => {
            detectPose(video, canvas);
        });
    } catch (err) {
        console.error("攝像頭錯誤:", err);
        alert("無法訪問攝像頭，請確保已授予權限！");
    }
}

async function detectPose(video, canvas) {
    if (!poseDetector) {
        const vision = await VisionTasks.FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        poseDetector = await VisionTasks.PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
            },
            runningMode: "VIDEO",
        });
    }

    const ctx = canvas.getContext("2d");
    let lastTime = 0;

    async function processFrame() {
        if (video.readyState >= 2) { // 確保視頻已載入
            const now = performance.now();
            if (now - lastTime >= 1000 / 30) { // 30 FPS
                lastTime = now;
                const result = poseDetector.detectForVideo(video, now);
                drawPose(result, canvas, ctx);
            }
        }
        requestAnimationFrame(processFrame);
    }

    processFrame();
}

function drawPose(result, canvas, ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (result.landmarks) {
        result.landmarks.forEach(landmark => {
            landmark.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x * canvas.width, point.y * canvas.height, 5, 0, 2 * Math.PI);
                ctx.fillStyle = "red";
                ctx.fill();
            });
        });
    }
}

// 初始化頁面
document.addEventListener("DOMContentLoaded", () => {
    navigateToPage("home");
});