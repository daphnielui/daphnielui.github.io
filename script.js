// 全局變量
let waterAmount = 0;
let foodClassifier;
let poseDetector;

// 熱量資料庫（單位：大卡/100g）
const calorieDatabase = {
    "apple": 52,
    "banana": 89,
    "pizza": 266,
    "hamburger": 295,
    "rice": 130,
    "bread": 265,
    "egg": 155,
    "chicken": 239,
    "fish": 206,
    "salad": 15
};
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
