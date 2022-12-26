
faceapi.env.monkeyPatch({
    Canvas: HTMLCanvasElement,
    Image: HTMLImageElement,
    ImageData: ImageData,
    Video: HTMLVideoElement,
    createCanvasElement: () => document.createElement('canvas'),
    createImageElement: () => document.createElement('img')
})

const video = document.getElementById('videoInput')

// Promise.all([
//     faceapi.nets.faceRecognitionNet.loadFromUri('models'),
//     faceapi.nets.faceLandmark68Net.loadFromUri('models'),
//     faceapi.nets.ssdMobilenetv1.loadFromUri('models') //heavier/accurate version of tiny face detector
// ]).then(start)

Promise.all([
    faceapi.loadSsdMobilenetv1Model('models'),
    faceapi.loadFaceLandmarkModel('models'),
    faceapi.loadFaceRecognitionModel('models'),
    faceapi.loadTinyFaceDetectorModel('models'),
    faceapi.loadFaceLandmarkModel('models'),
    faceapi.loadFaceLandmarkTinyModel('models'),
    faceapi.loadFaceRecognitionModel('models'),
    faceapi.loadFaceExpressionModel('models'),
  ]).then(start)
  .catch(err => console.error(err));

function start() {
    // document.body.append('Models Loaded')
    
    navigator.getUserMedia(
        { video:{} },
        stream => video.srcObject = stream,
        err => console.error(err)
    )
    
    //video.src = '../videos/speech.mp4'
    console.log('video added')
    recognizeFaces()
}

async function recognizeFaces() {

    const labeledDescriptors = await loadLabeledImages()
    console.log(labeledDescriptors)
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.7)


    video.addEventListener('play', async () => {
 
        
        console.log('Playing')
            const canvas = faceapi.createCanvasFromMedia(video);
            document.body.append(canvas);
            const displaySize = { width: video.width, height: video.height };
            faceapi.matchDimensions(canvas, displaySize);

            //Asynchronusly get detections from the video Stream
            setInterval(async () => {
            const detections = await faceapi
                .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()) //Face Detectors
                .withFaceLandmarks()  // Get cordinates of landmarks
                .withFaceExpressions()
                .withFaceDescriptors()
                ;  //Get Face Expression confidence values
            // Resize and Display the detections on the video frame using canvas
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            
            const results = resizedDetections.map((d) => {
                return faceMatcher.findBestMatch(d.descriptor)
            })
            results.forEach( (result, i) => {

                const boxDetect = resizedDetections[i].detection.box
                const drawBoxDetect = new faceapi.draw.DrawBox(boxDetect, { label: result.toString() })
                drawBoxDetect.draw(canvas);

                // console.log(result.toString());
                faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
                // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

                // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
                const happy = (detections[0].expressions.happy);
                var text = result.toString().split("(");
                // document.getElementById("getLabel").value = text[0];
                // var id_user = text[0].split(".");
                // document.getElementById("datang").value = id_user[0];
                // document.getElementById("pulang").value = id_user[0];
                console.log(result)
                // if(happy > 0.8){
                //     document.getElementById("getLabel").value = id_user[1] + " : " + "Bahagia";
                //     console.log(id_user[1] + " : happy");
                // }else{
                //     document.getElementById("getLabel").value =  "";
                //     console.log(id_user[1] + " : netral");

                // }
                })
        
            // faceapi.draw.drawDetections(canvas, resizedDetections);
            // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            // faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
            // //Printing the detection coordinates
            // console.log(detections);
            }, 100)

        
    })
}


function loadLabeledImages() {
    const labels = ['1.Anton Arizal','2.Black Widow', '3.Captain America']
    //const labels = ['Prashant=7t/mc  Kumar'] // for WebCam
    return Promise.all(
        labels.map(async (label)=>{
            const descriptions = []
            for(let i=1; i<=2; i++) {
                const img = await faceapi.fetchImage(`labeled_images/${label}/${i}.png`)
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                console.log(label + i + JSON.stringify(detections))
                descriptions.push(detections.descriptor)
            }
            // document.body.append(label+' Faces Loaded | ')
            return new faceapi.LabeledFaceDescriptors(label, descriptions)
        })
    )
}

function insert(){

      const img = document.querySelector("#img");
      const canvas = document.createElement("canvas");
      const video = document.querySelector("video");

    //   captureVideoButton.onclick = function () {
    //     navigator.mediaDevices
    //       .getUserMedia(constraints)
    //       .then(handleSuccess)
    //       .catch(handleError);
    //   };
      
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        // Other browsers will fall back to image/png
        // img.src = canvas.toDataURL("image/webp");
        console.log(canvas.toDataURL("image/webp"))
        $("#ModalFoto").modal("show");
        var foto = canvas.toDataURL("image/webp");
        $("#load_foto").html('<img style="width:100%" src="' + foto + '">');
        

    // Webcam.set({
    //     width: 300,
    //     height: 260,
    //     image_format: 'jpeg',
    //     jpeg_quality: 90
    // });
    // Webcam.attach('#my_camera');
    
    var name =document.getElementById("getLabel").value ;
    // alert(name)
    // Webcam.snap(function(data_uri) {
    //     $("#ModalFoto").modal("show");
    //     $("#load_foto").html('<img style="width:100%" src="'+data_uri+'">');

    // });

}
$(document).ready(function(e) {
    ajaxData = 'http://localhost:8899/index.php/absensi/table';
    var table = $('#tableAbsensi').DataTable({
        "language": {
            "emptyTable": "&lt;  No data available in table &gt;"
        },
        scrollY: '65vh',
        "scrollX": true,
        "pageLength": 5000,
        "paginate": false,
        "bFilter": true,
        "info": false,
        "bLengthChange": false,
        "serverSide": true,
        "ajax": {
            "url": ajaxData,
            "type": "POST"
        },
        "order": [
            [0, "desc"]
        ],
        "columnDefs": [{
            "targets": [4],
            "visible": false,
            "searchable": false
        }]

    });
              
})