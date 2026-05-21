// QUESTIONS
let questions = [
    "Have you noticed blurred or cloudy vision?",
    "Do bright lights create glare or halos?",
    "Do you have difficulty seeing at night?",
    "Do colors appear faded or yellowish?"
];

let currentQuestion = 0;
let riskScore = 0;

const card = document.getElementById("card");
const questionText = document.getElementById("questionText");

function loadQuestion() {
    questionText.innerText = questions[currentQuestion];
}

function flipCard() {
    card.classList.add("flip");
}

function selectAnswer(event, score) {

    const buttons = document.querySelectorAll(".option-btn");

    // Remove previous selection
    buttons.forEach(btn => btn.classList.remove("selected"));

    // Highlight clicked button
    event.target.classList.add("selected");

    // Prevent double clicking
    buttons.forEach(btn => btn.disabled = true);

    riskScore += score;

    setTimeout(() => {

        card.classList.remove("flip");
        currentQuestion++;

        // Re-enable buttons for next question
        buttons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove("selected");
        });

        if (currentQuestion < questions.length) {
            loadQuestion();
        } else {
            showResult();
        }

    }, 400);
}

function showResult() {

    document.querySelector(".flashcard-container").innerHTML = `
        <div class="result-box">
            <h3>Your Risk Score: ${riskScore}</h3>
            <p>${getRiskMessage()}</p>
            <button onclick="goToUpload()" class="primary-btn">
                Continue to AI Analysis
            </button>
        </div>
    `;
}

function getRiskMessage() {

    if (riskScore <= 2) {
        return "Low symptom risk detected.";
    } 
    else if (riskScore <= 5) {
        return "Moderate symptom risk detected.";
    } 
    else {
        return "High symptom risk detected. Professional consultation recommended.";
    }
}

function goToUpload() {
    document.getElementById("selfTestSection").classList.add("hidden");
    document.getElementById("imageSection").classList.remove("hidden");
}

loadQuestion();

// REVEAL ANIMATION
function revealOnScroll() {
    document.querySelectorAll(".reveal").forEach(section => {
        const top = section.getBoundingClientRect().top;

        if (top < window.innerHeight - 100) {
            section.classList.add("active");
        }
    });
}

// Run when page loads
window.addEventListener("load", revealOnScroll);

// Run when scrolling
window.addEventListener("scroll", revealOnScroll);

let stream = null;

const imageInput = document.getElementById("imageUpload");
const previewContainer = document.getElementById("previewContainer");
const previewImage = document.getElementById("previewImage");
const fileName = document.getElementById("fileName");

imageInput.addEventListener("change", function () {

    const file = this.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            previewImage.src = e.target.result;
            previewContainer.classList.remove("hidden");
        };

        reader.readAsDataURL(file);

        fileName.textContent = file.name;
    }
});

/* ===============================
   CAMERA START
================================= */
function startCamera() {
    const cameraBox = document.getElementById("cameraBox");
    const video = document.getElementById("video");

    cameraBox.classList.remove("hidden");

    navigator.mediaDevices.getUserMedia({ video: true })
        .then((mediaStream) => {
            stream = mediaStream;
            video.srcObject = stream;
        })
        .catch((error) => {
            console.error(error);
            alert("Camera access denied or not available.");
        });
}

/* ===============================
   CAPTURE IMAGE FROM CAMERA
================================= */
function captureImage() {
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");

    canvas.classList.remove("hidden");

    const context = canvas.getContext("2d");

    // Set canvas size same as video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Stop camera after capture
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    document.getElementById("cameraBox").classList.add("hidden");
}

/* ===============================
   ANALYZE IMAGE
================================= */
function analyzeImage() {
    const fileInput = document.getElementById("imageUpload");
    const canvas = document.getElementById("canvas");
    const resultText = document.getElementById("resultText");

    let formData = new FormData();

    // Case 1: File uploaded
    if (fileInput.files.length > 0) {
        formData.append("image", fileInput.files[0]);
    }

    // Case 2: Captured from camera
    else if (!canvas.classList.contains("hidden")) {
        canvas.toBlob(function(blob) {
            formData.append("image", blob);
            sendToServer(formData);
        }, "image/jpeg");
        return;
    }

    else {
        alert("Please upload or capture an image.");
        return;
    }

    sendToServer(formData);
}

/* ===============================
   SEND TO FLASK BACKEND
================================= */
function sendToServer(formData) {

    const resultText = document.getElementById("resultText");

    resultText.innerHTML = `
        <div style="padding:15px;">
            🔍 Analyzing image... Please wait
        </div>
    `;

    fetch("/predict", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {

        if (data.error) {
            resultText.innerHTML = `
                <div style="background:#ffe5e5;padding:15px;border-radius:10px;color:#b30000;">
                    Backend Error: ${data.error}
                </div>
            `;
            return;
        }

        resultText.innerHTML = `
        <div style="
            padding:25px;
            background:${data.color === "red" ? "#ffe5e5" : "#e6f7ec"};
            border-radius:15px;
            text-align:center;
        ">
            <h2 style="color:${data.color}; margin-bottom:15px;">
                ${data.condition}
            </h2>

            <p style="font-size:16px; font-weight:600;">
                Risk Level: ${data.risk_level}
            </p>

            <p style="margin-top:10px;">
                Confidence Level: ${data.confidence}%
            </p>

            <p style="margin-top:20px; font-size:15px;">
                ${data.recommendation}
            </p>

            <hr style="margin:20px 0;">

            <p style="font-size:13px; color:gray;">
                Disclaimer: This AI-based tool is for screening purposes only 
                and does not replace professional medical diagnosis.
            </p>
        </div>
    `;
    })
    .catch(error => {
        console.error(error);
        resultText.innerHTML = `
            <div style="background:#ffe5e5;padding:15px;border-radius:10px;color:#b30000;">
                Connection Error. Check Flask server.
            </div>
        `;
    });
}