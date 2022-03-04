// //@ts-check

import React, { useState, useEffect, Component, useRef } from 'react'
import Webcam from 'react-webcam'
import ReactPlayer from 'react-player'

import './App.css'


let Video_info = []
//const fs = require('fs')
const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg')


function WebcamStreamCapture(props) {
	const webcamRef = React.useRef(null)
	const mediaRecorderRef = React.useRef(null)
	const [capturing, setCapturing] = React.useState(false)
	const [recordedChunks, setRecordedChunks] = React.useState([])

	const preview = useRef()

	//시작시간
	const [startTime, setStartTime] = React.useState('0:00')
	//끝시간
	const [endTime, setEndTime] = React.useState('0:00')

	// start capture 버튼
	const handleStartCaptureClick = React.useCallback(() => {
		setCapturing(true)
		mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
			mimeType: 'video/webm',
		})
		mediaRecorderRef.current.addEventListener(
			'dataavailable',
			handleDataAvailable
		)
		mediaRecorderRef.current.start()
	}, [webcamRef, setCapturing, mediaRecorderRef])

	const handleDataAvailable = React.useCallback(
		({ data }) => {
			if (data.size > 0) {
				// 캡쳐한것 있으면 지우고 다시 녹화
				setRecordedChunks([])
				setRecordedChunks((prev) => prev.concat(data))
			}
			//console.log(recordedChunks)
		},
		[setRecordedChunks]
	)

	const handleStopCaptureClick = React.useCallback(() => {
		mediaRecorderRef.current.stop()

		setCapturing(false)
	}, [mediaRecorderRef, webcamRef, setCapturing])

	const playRecording = React.useCallback(() => {
		//console.log(recordedChunks)
		if (recordedChunks.length) {
			const blob = new Blob(recordedChunks, {
				type: 'video/webm',
			})
			preview.current.src = URL.createObjectURL(blob)
		}

		//console.log('webcam_1 / playRecording : ', preview.current.src)
	}, [recordedChunks])

	const okButton = React.useCallback(() => {
		//console.log(props.length)

		if (recordedChunks.length) {
			const blob = new Blob(recordedChunks, {
				type: 'video/webm',
			})
			console.log('ok 버튼 clicked')
			props.setVideoProps([URL.createObjectURL(blob)]) // []로 주소 감싸고 내보내기

			console.log('인덱스 : ', props.videoIndex)

			// 여따 전체저장?
			if (Video_info[props.videoIndex] == null) {
				Video_info.concat([])
				//setVideo_info((Video_info) => Video_info.concat([]))

				Video_info[props.videoIndex] = [
					props.videoIndex,
					getSecondsFromHHMMSS(startTime),
					getSecondsFromHHMMSS(endTime),
					URL.createObjectURL(blob),
					blob,
				]
			} else {
				/*
            Video_info[props.videoIndex] = [
               props.videoIndex,
               getSecondsFromHHMMSS(startTime),
               getSecondsFromHHMMSS(endTime),
               URL.createObjectURL(blob),
            ]*/
				Video_info[props.videoIndex][0] = props.videoIndex
				Video_info[props.videoIndex][1] = getSecondsFromHHMMSS(startTime)
				Video_info[props.videoIndex][2] = getSecondsFromHHMMSS(endTime)
				Video_info[props.videoIndex][3] = URL.createObjectURL(blob)
				Video_info[props.videoIndex][4] = blob
			}
		}

		console.log('ok버튼')
	}, [recordedChunks])

	//다운로드 버튼
	const handleDownload = React.useCallback(() => {
		if (recordedChunks.length) {
			const blob = new Blob(recordedChunks, {
				type: 'video/webm',
			})
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			document.body.appendChild(a)
			a.style = 'display: none'
			a.href = url
			a.download = 'react-webcam-stream-capture.webm'
			a.click()
			window.URL.revokeObjectURL(url)
			//setRecordedChunks([])
		}
	}, [recordedChunks])

	const startonChange = (event) => {
		setStartTime(event.target.value)
	}
	const endonChange = (event) => {
		setEndTime(event.target.value)
	}

	const startonBlur = (event) => {
		const value = event.target.value
		const seconds = Math.max(0, getSecondsFromHHMMSS(value))

		const time = toHHMMSS(seconds)
		setStartTime(time)
	}
	const endonBlur = (event) => {
		const value = event.target.value
		const seconds = Math.max(0, getSecondsFromHHMMSS(value))

		const time = toHHMMSS(seconds)
		setEndTime(time)
		console.log('end Time : ', getSecondsFromHHMMSS(endTime))
	}

	const getSecondsFromHHMMSS = (value) => {
		const [str1, str2, str3] = value.split(':')

		const val1 = Number(str1)
		const val2 = Number(str2)
		const val3 = Number(str3)

		if (!isNaN(val1) && isNaN(val2) && isNaN(val3)) {
			return val1
		}

		if (!isNaN(val1) && !isNaN(val2) && isNaN(val3)) {
			return val1 * 60 + val2
		}

		if (!isNaN(val1) && !isNaN(val2) && !isNaN(val3)) {
			return val1 * 60 * 60 + val2 * 60 + val3
		}

		return 0
	}

	const toHHMMSS = (secs) => {
		const secNum = parseInt(secs.toString(), 10)
		const hours = Math.floor(secNum / 3600)
		const minutes = Math.floor(secNum / 60) % 60
		const seconds = secNum % 60

		return [hours, minutes, seconds]
			.map((val) => (val < 10 ? `0${val}` : val))
			.filter((val, index) => val !== '00' || index > 0)
			.join(':')
			.replace(/^0/, '')
	}

	return (
		<div class="videoContainer">
			<div>
				<h3>Start time</h3>

				<input
					class="input"
					type="text"
					onChange={startonChange}
					onBlur={startonBlur}
					value={startTime}
				/>
			</div>
			<div>
				<h3>End time</h3>
				<input
					class="input"
					type="text"
					onChange={endonChange}
					onBlur={endonBlur}
					value={endTime}
				/>
			</div>
			<div class="br"></div>
			<br />

			<div class="recordingBox">
				<h2>Recording</h2>
				<Webcam audio={false} ref={webcamRef} />
				<div class="br"></div>
				{capturing ? (
					<button onClick={handleStopCaptureClick}>Stop Capture</button>
				) : (
					<button onClick={handleStartCaptureClick}>Start Capture</button>
				)}
				<br />
				{recordedChunks.length > 0 && [
					<button onClick={handleDownload}>Download</button>,
				]}
			</div>

			<div class="playingBox">
				<h2>Preview</h2>
				<video ref={preview} autoPlay></video>
				<div class="br"></div>
				<button onClick={playRecording}>Play</button>
				<button onClick={okButton}>OK</button>
			</div>
			<div class="br"></div>
			<br />
			
		</div>
	)
}

function App() {

  // 여기서부터 가져온거
	const [videoProps, setVideoProps] = React.useState([[]]) // 녹화된영상의 blob src 저장
	const [videoPropsIndex, setVideoPropsIndex] = React.useState(0) // 영상 인덱스 (사용하려나?)
	const [videoNum, setVideoNum] = React.useState(0) // 녹화된 영상 갯수
	const [concatVideoUrl, setConcatVideoUrl] = React.useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const handleChangeYoutubeURL = (e) => {
		setYoutubeUrl(e.target.value)
		console.log(youtubeUrl)
	}
  const [webcamControler, setWebcamControler] = useState([
		[<WebcamStreamCapture setVideoProps={setVideoProps} videoIndex={0} />],
	])
  const [webcamControlerIndex, setWebcamControlerIndex] = useState(1)

	function addWebcamControler(webcamControlerIndex) {
		let index_input = webcamControlerIndex
		setWebcamControler((webcamControler) =>
			webcamControler.concat([
				<WebcamStreamCapture
					setVideoProps={setVideoProps}
					videoIndex={index_input}
				/>,
			])
		)
		setWebcamControlerIndex((webcamControlerIndex = webcamControlerIndex + 1))
		//this.count
	}
  const renderLoadButton = (url, label) => {
		return <button onClick={() => setYoutubeUrl(url)}>{label}</button>
	}

  //아래 ffmpeg 부분
  let step = 0
  const ffmpeg = createFFmpeg({
		//corePath: 'http://localhost:3000/ffmpeg-core.js',
		//corePath: './node_modules/@ffmpeg/core/dist/ffmpeg-core.js',
		// Use public address
		log: true,
	})
  const concatVideos = async () => {
		let readyToConcat = []
		console.log('Start concat videos. ')
		//
		for (step = 0; step < Video_info.length; step++) {
			console.log('for 도는중 ', step)

			//console.log(Video_info[step][3] == null)
			if (Video_info[step][4] != null) {
				readyToConcat.push([Video_info[step][4], [step]])
				console.log('비디오 blob 추가 주소 : ', Video_info[step][4])
			}
		}
		console.log('readyToConcat : ', readyToConcat)

		console.log('ffmpeg load ㄱㄱ')
		await ffmpeg.load()
		console.log('ffmpeg load 완')
		const inputPaths = []
		console.log('readyToConcat : ', readyToConcat)
		for (const file of readyToConcat) {
			const name = file[1].toString()
			console.log('name : ', name, 'flie : ', file)
			ffmpeg.FS('writeFile', name, await fetchFile(file[0]))
			inputPaths.push(`file ${name}`)
		}
		console.log('imput path 완')
		console.log(inputPaths)
		ffmpeg.FS('writeFile', 'concat_list.txt', inputPaths.join('\n'))
		console.log('inputPaths.join(\n) 완')
		await ffmpeg.run(
			'-f',
			'concat',
			'-safe',
			'0',
			'-i',
			'concat_list.txt',
			'output.mp4'
		)
		console.log('ffmpeg run 완')
		const data = ffmpeg.FS('readFile', 'output.mp4')

		setConcatVideoUrl(
			URL.createObjectURL(
				new Blob([data.buffer], {
					type: 'video/mp4',
				})
			)
		)
		const blob_2 = new Blob([data.buffer], {
			type: 'video/mp4',
		})
		//preview.current.src = URL.createObjectURL(blob)
		console.log('blob 체크 : ', blob_2)
		console.log('blob URL ~~ 체크 : ', URL.createObjectURL(blob_2))

		console.log('Data 체크 : ', data)
		console.log('Data 버퍼 체크 : ', data.buffer)

		let formData = new FormData()
		//let formData2 = new FormData()
		const config = {
			header: { 'content-type': 'multipart/form-data' },
		}
		formData.append('file', data)
		//formData2.append('file', data)
		console.log('formData 체크 : ', formData)
	}

  return (
    
    <div class="WholeDiv">
      <br />
      <br />
      Youtube URL
				<input
					value={youtubeUrl}
					onChange={handleChangeYoutubeURL}
					size={60}
				/>
				{renderLoadButton(
					'https://www.youtube.com/watch?v=oUFJJNQGwhk',
					'Test A'
				)}
      <br />
      <br />
      <ReactPlayer url={youtubeUrl} controls="true"></ReactPlayer>
      <br />
      <br />
      <button onClick={() => addWebcamControler(webcamControlerIndex)}>
        Add Record
      </button>
      <br />
      <div class="scrollbar">
        {webcamControler}
        <br />
        <button
					onClick={() =>
						console.log(
							'video props : ',
							Video_info,
							'길이 : ',
							Video_info.length
						)
					}
				>
          인덱스, 주소 확인
        </button>
        <button onClick={() => concatVideos()}>Concat</button>
      </div>
      <br />
      <br />
      <ReactPlayer url={concatVideoUrl} controls="true"></ReactPlayer>
      <br />
      <br />
      
    </div>
  )
}

export default App
