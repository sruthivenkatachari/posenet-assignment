// 1. Install dependencies DONE
// 2. Import dependencies DONE
// 3. Setup webcam and canvas DONE
// 4. Define references to those DONE
// 5. Load posenet DONE
// 6. Detect function DONE
// 7. Drawing utilities from tensorflow DONE
// 8. Draw functions DONE

import React, { useRef } from "react";
import "./App.css";
// import * as tf from "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";
import Webcam from "react-webcam";
import { drawKeypoints, drawSkeleton } from "./utilities";
import { kneeFlexion } from "./algorithm";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  //  Load posenet
  const runPosenet = async () => {
    const net = await posenet.load({
      inputResolution: { width: 640, height: 480 },
      scale: 0.8,
    });
    //
    setInterval(() => {
      detect(net);
    }, 500);
  };

  var resetPosition = true;
  var squatCount = 0;
  var confidence = 0;
  const detect = async (net) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Make Detections
      const pose = await net.estimateSinglePose(video);
      // if (resetPosition) {
      //   drawCanvas(pose, video, videoWidth, videoHeight, canvasRef, "red");
      // } else {
      //   drawCanvas(pose, video, videoWidth, videoHeight, canvasRef, "green");
      // }

      var keypoints = [];
      pose.keypoints.forEach((obj) => {
        const score = obj.score.toFixed(4);
        const bodyParts = [
          "leftKnee",
          "rightKnee",
          "leftHip",
          "rightHip",
          "leftAnkle",
          "rightAnkle",
        ];
        if (bodyParts.includes(obj.part) && score > 0.8) {
          keypoints.push(obj);
        }
      });

      keypoints.forEach((element) => {
        confidence += element.score;
      });
      if (confidence) {
        document.getElementById("confidence").innerHTML = (
          confidence / 6
        ).toFixed(4);
      } else {
        document.getElementById("confidence").innerHTML = 0;
      }
      confidence = 0;

      if (keypoints.length !== 6) {
        return;
      }
      var temp = { left: {}, right: {} };
      for (var i = 0; i < keypoints.length; i++) {
        if (keypoints[i].part.startsWith("left")) {
          const part = keypoints[i].part.replace("left", "");
          temp.left[part] = keypoints[i].position;
        } else {
          const part = keypoints[i].part.replace("right", "");
          temp.right[part] = keypoints[i].position;
        }
      }
      keypoints = temp;

      const leftSquat = kneeFlexion(
        keypoints.left.Ankle,
        keypoints.left.Knee,
        keypoints.left.Hip,
        "left"
      );

      const rightSquat = kneeFlexion(
        keypoints.right.Ankle,
        keypoints.right.Knee,
        keypoints.right.Hip,
        "right"
      );

      if (resetPosition) {
        if (leftSquat >= 200 && rightSquat >= 200) {
          console.log(leftSquat, rightSquat);
          squatCount += 1;
          resetPosition = false;
        }
      } else {
        if (leftSquat < 190 && rightSquat < 190) {
          resetPosition = true;
        }
      }
      if (leftSquat >= 200 && rightSquat >= 200) {
        drawCanvas(pose, video, videoWidth, videoHeight, canvasRef, "red");
      } else {
        drawCanvas(pose, video, videoWidth, videoHeight, canvasRef, "aqua");
      }
      console.log(squatCount);
      document.getElementById("squat-count").innerHTML = squatCount;
    }
  };

  const drawCanvas = (pose, video, videoWidth, videoHeight, canvas, color) => {
    var ctx = canvas.current.getContext("2d");
    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;
    ctx.fillStyle = color;
    console.log(color);

    drawKeypoints(pose["keypoints"], 0.6, ctx);
    drawSkeleton(pose["keypoints"], 0.7, ctx);
  };

  runPosenet();

  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />
        <div className="fixed-div">
          <p>
            Squats: <span id="squat-count">{squatCount}</span>
          </p>
          <p>
            Confidence: <span id="confidence">0</span>
          </p>
        </div>

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />
      </header>
    </div>
  );
}

export default App;
