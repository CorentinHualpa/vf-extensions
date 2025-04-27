export const VideoExtension = {
  name: 'Video',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_video' || trace.payload?.name === 'ext_video',
  render: ({ trace, element }) => {
    const videoElement = document.createElement('video')
    const { videoURL, autoplay, controls } = trace.payload

    videoElement.width = 240
    videoElement.src = videoURL

    if (autoplay) {
      videoElement.setAttribute('autoplay', '')
    }
    if (controls) {
      videoElement.setAttribute('controls', '')
    }

    videoElement.addEventListener('ended', function () {
      window.voiceflow.chat.interact({ type: 'complete' })
    })
    element.appendChild(videoElement)
  },
}
