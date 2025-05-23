import React, { useState } from 'react';
import axios from 'axios';
import { ipAddress } from '../Constants/ip';
interface PredictionResult {
  prediction: number;
  svm_prediction: number;
  uncertain: boolean;
}

function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [log, setLog] = useState<string>('');
  const [trueLabel, setTrueLabel] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('Chưa chọn file');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setLog('');
      setPrediction(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFileName('Chưa chọn file');
      setImage(null);
      setLog('');
      setPrediction(null);
    }
  };

  const handlePredict = async () => {
    if (!image) {
      alert('Vui lòng chọn ảnh trước khi dự đoán');
      return;
    }

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      alert('Không tìm thấy file');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post<PredictionResult>( `${ipAddress}/predict`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = response.data;
      setPrediction(data);

      let logMessage = `\nẢnh: ${file.name}\nSVM: ${data.svm_prediction}\n`;
      if (data.uncertain) {
        logMessage += `Số ảnh không chắc chắn: 1\nKNN: ${data.prediction}\n`;
      }
      logMessage += `Kết quả: ${data.prediction}`;

      if (trueLabel) {
        const isCorrect = parseInt(trueLabel) === data.prediction;
        setLog(prevLog => `${prevLog}${logMessage}\nNhãn thật: ${trueLabel} - ${isCorrect ? 'Đúng ✅' : 'Sai ❌'}`);
      } else {
        setLog(prevLog => `${prevLog}${logMessage}`);
      }
    } catch (error) {
      console.error('Error during prediction:', error);
      setLog(prevLog => `${prevLog}\nLỗi: Không thể dự đoán`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setImage(null);
    setPrediction(null);
    setLog('');
    setTrueLabel('');
    setFileName('Chưa chọn file');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="container">
      <div className="app-header">
        <h1>Nhận Diện Chữ Số Viết Tay</h1>
        <p className="app-description">Tải lên ảnh chữ số viết tay để hệ thống nhận diện</p>
      </div>
      
      <div className="content">
        <div className="left-panel">
          <div className="upload-section">
            <h2>Tải lên ảnh</h2>
            
            <div className="file-upload">
              <div className="file-upload-label">
                <i className="upload-icon">📁</i>
                <span>{fileName}</span>
              </div>
              <input
                type="file"
                id="file-input"
                accept="image/*"
                onChange={handleImageChange}
              />
              <label htmlFor="file-input" className="custom-file-button" >
                Chọn ảnh
              </label>
            </div>
            
          </div>
          
          <div className="image-preview-container">
            {image ? (
              <div className="image-preview">
                <img src={image} alt="Uploaded" />
              </div>
            ) : (
              <div className="image-placeholder">
                <span>Ảnh xem trước</span>
              </div>
            )}
          </div>
          
          <div className="button-group">
            <button 
              className={`predict-button ${isLoading ? 'loading' : ''}`} 
              onClick={handlePredict}
              disabled={isLoading || !image}
            >
              {isLoading ? 'Đang xử lý...' : 'Dự đoán'}
            </button>
            <button className="clear-button" onClick={handleClear}>
              Xóa
            </button>
          </div>
        </div>
        
        <div className="right-panel">
          <div className="prediction-section">
            <h2>Kết Quả Dự Đoán</h2>
            
            {prediction ? (
              <div className={`result-box ${prediction.uncertain ? 'uncertain' : ''}`}>
                <div className="result-main">
                  <div className="prediction-number">{prediction.prediction}</div>
                  <div className="prediction-label">Kết quả dự đoán</div>
                </div>
                
                <div className="result-details">
                  <div className="detail-item">
                    <span className="detail-label">Dự đoán SVM:</span>
                    <span className="detail-value">{prediction.svm_prediction}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Không chắc chắn:</span>
                    <span className={`detail-value ${prediction.uncertain ? 'uncertain-value' : ''}`}>
                      {prediction.uncertain ? 'Có' : 'Không'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-result">
                <div className="no-result-icon">?</div>
                <p>Chưa có kết quả dự đoán</p>
              </div>
            )}
          </div>
          
          <div className="log-section">
            <div className="log-header">
              <h2>Log Chi Tiết</h2>
            </div>
            <textarea 
              className="log-textarea" 
              value={log} 
              readOnly 
              placeholder="Nhật ký dự đoán sẽ hiển thị tại đây..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;