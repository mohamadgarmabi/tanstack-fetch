import { useUploadApp } from './upload.hook'

const App = () => {
  const { progress, resultUrl, errorMessage, isUploading, handleFileChange } = useUploadApp()

  return (
    <div>
      <h1>Upload avatar</h1>
      <input type="file" accept="image/*" disabled={isUploading} onChange={handleFileChange} />
      {isUploading ? <p>Uploading… {progress}%</p> : null}
      {resultUrl ? (
        <p>
          Done: <a href={resultUrl}>{resultUrl}</a>
        </p>
      ) : null}
      {errorMessage ? <p>{errorMessage}</p> : null}
    </div>
  )
}

export default App
export { App }
