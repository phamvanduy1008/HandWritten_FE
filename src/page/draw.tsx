import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { ipAddress } from '../Constants/ip';

// Cập nhật interface để khớp với phản hồi từ /predict_advanced
interface PredictionResult {
    prediction: number;
    svm_prediction: number;
    uncertain: boolean;
}

function Draw() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const [log, setLog] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 12;
                ctx.lineCap = 'round';
            }
        }
    }, []);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            setIsDrawing(true);
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
            }
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handlePredict = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsLoading(true);
        const dataUrl = canvas.toDataURL('image/png');
        const blob = await (await fetch(dataUrl)).blob();
        const formData = new FormData();
        formData.append('file', blob, 'drawing.png');

        try {
            const response = await axios.post<PredictionResult>(`${ipAddress}/predict`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const data = response.data;
            setPrediction(data);

            let logMessage = `\nẢnh: drawing.png\nSVM: ${data.svm_prediction}\n`;
            if (data.uncertain) {
                logMessage += `Số ảnh không chắc chắn: 1\nKNN: ${data.prediction}\n`;
            }
            logMessage += `Kết quả: ${data.prediction}`;
            setLog(prevLog => `${prevLog}${logMessage}`);
        } catch (error) {
            console.error('Error during prediction:', error);
            setLog(prevLog => `${prevLog}\nLỗi: Không thể dự đoán`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
        setPrediction(null);
        setLog('');
    };

    return (
        <div className="container">
            <div className="app-header">
                <h1>Nhận Diện Chữ Số Viết Tay - Vẽ</h1>
                <p className="app-description">Vẽ chữ số trên canvas để hệ thống nhận diện</p>
            </div>
            
            <div className="content">
                <div className="left-panel" style={{ width: '50%' }}>
                    <div className="upload-section">
                        <h2>Vẽ chữ số</h2>
                    </div>
                    <div className="image-preview-container">
                        <canvas
                            ref={canvasRef}
                            width={300}
                            height={300}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseOut={stopDrawing}
                            style={{ backgroundColor: 'black', cursor: 'crosshair' }}
                        />
                    </div>
                    <div className="button-group">
                        <button
                            className={`predict-button ${isLoading ? 'loading' : ''}`}
                            onClick={handlePredict}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang xử lý...' : 'Dự đoán'}
                        </button>
                        <button className="clear-button" onClick={handleClear}>
                            Xóa
                        </button>
                    </div>
                </div>
                
                <div className="right-panel" style={{ width: '50%' }}>
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

export default Draw;