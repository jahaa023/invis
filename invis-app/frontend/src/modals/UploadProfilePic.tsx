import { useState, type ChangeEvent , useRef, useCallback } from 'react';
import { useModal } from '../ModalContext';
import ReactCrop, {
    type Crop,
    type PixelCrop,
    centerCrop,
    makeAspectCrop
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'
const apiURL = import.meta.env.VITE_API_URL;

export default function UploadProfilePic ({
        showPopup,
        loadSettings
        }: {
        showPopup: (message: string, timeout? : number, type?: string) => void;
        loadSettings: () => void;
    }) {
    const { hideModal} = useModal();
    const [ fileURL, setFileURL ] = useState("")
    const [ cropperActive, setCropperActive ] = useState(false)
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [crop, setCrop] = useState<Crop>({
        unit: 'px',
        width: 128,
        height: 128,
        x: 25,
        y: 25,
    })

    // Centers crop to middle of image
    function centerAspectCrop(
        mediaWidth: number,
        mediaHeight: number,
        aspect: number
        ): Crop {
        return centerCrop(
            makeAspectCrop(
            {
                unit: 'px',
                width: 128,
            },
            aspect,
            mediaWidth,
            mediaHeight
            ),
            mediaWidth,
            mediaHeight
        );
    }


    // Converts uploaded image to cached blob
    const handleImageChange = async (event : ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) return;
        const uploadedFile = event.target.files[0]
        const cachedURL = URL.createObjectURL(uploadedFile);
        setFileURL(cachedURL)
        setCropperActive(true)
    }

    // Get width and height of image on load
    const onImageLoad = useCallback((img: HTMLImageElement) => {
        imgRef.current = img;
        const { width, height } = img;
        setCrop(centerAspectCrop(width, height, 1));
    }, []);

    // Uploads crop
    const handleUpload = async () => {
        // If crop isnt complete yet
        if (!completedCrop || !imgRef.current) return;

        // Create a canvas element and draw cropped image onto it
        const canvas = document.createElement('canvas');
        const image = imgRef.current;

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        canvas.width = completedCrop.width;
        canvas.height = completedCrop.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            completedCrop.width,
            completedCrop.height
        );

        // Then convert the canvas into a blob
        return new Promise<void>((resolve, reject) => {
            canvas.toBlob(async (blob) => {
                // If canvas is empty
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }

                // Create formdata to append image to
                const formData = new FormData();
                formData.append('file', blob, 'cropped.jpg');

                // Upload the formdata
                const response = await fetch(`${apiURL}/upload_profile_pic`, {
                    method: 'POST',
                    body: formData,
                    credentials: "include"
                })

                const response_json = await response.json()

                if (response.ok) {
                    showPopup(response_json.message, 3000, "success")
                    hideModal()
                    loadSettings()
                    resolve();
                } else {
                    showPopup(response_json.error.message, 3000, "error")
                    hideModal()
                    reject();
                }
            },'image/jpeg', 0.95);
        });
    };

    return ( 
        <div className="p-4 bg-background-black border-2 border-black-lighter-border rounded-md max-w-[80vw] relative">
            {!cropperActive && <>
                <h1 className='font-bold text-xl'>Upload profile picture</h1>
                <p>The following image formats are supported:</p>
                <ul className='font-light list-disc ml-4'>
                    <li>JPEG</li>
                    <li>PNG</li>
                    <li>WebP</li>
                </ul>
                <div className='mt-3 flex items-center gap-2'>
                    <label
                        htmlFor="file_input"
                        className='text-sm p-2 border-brand border-2 text-brand rounded-md cursor-pointer hover:bg-brand hover:text-text-light'
                        title='Upload file'
                    >Upload</label>
                    <input
                        id='file_input'
                        type="file"
                        className='hidden'
                        accept='image/jpg, image/jpeg, image/png, image/webp'
                        onChange={handleImageChange}
                    />
                    <button
                        className='text-sm p-2 border-cancel-grey border-2 text-cancel-grey rounded-md cursor-pointer hover:bg-cancel-grey hover:text-text-light'
                        title='Cancel'
                        onClick={() => hideModal()}
                    >Cancel</button>
                </div>
            </>}
            {cropperActive && <>
            <div>
                <ReactCrop
                    className='max-w-[80vw] max-h-[80vh]'
                    crop={crop}
                    onChange={c => setCrop(c)}
                    minWidth={128}
                    minHeight={128}
                    aspect={1}
                    circularCrop
                    onComplete={(c) => setCompletedCrop(c)}
                >
                    <img src={fileURL} onLoad={(e) => onImageLoad(e.currentTarget)}/>
                </ReactCrop>
                <div className='mt-3 flex items-center gap-2'>
                    <button
                        className='text-sm p-2 border-brand border-2 text-brand rounded-md cursor-pointer hover:bg-brand hover:text-text-light'
                        title='Save'
                        onClick={handleUpload}
                    >Save</button>
                    <button
                        className='text-sm p-2 border-cancel-grey border-2 text-cancel-grey rounded-md cursor-pointer hover:bg-cancel-grey hover:text-text-light'
                        title='Cancel'
                        onClick={() => hideModal()}
                    >Cancel</button>
                </div>
            </div>
            </>}
        </div>
    )
}