import fs from 'react-native-fs';
import Axios from 'axios';
import { GOOGLE_STT_LINK } from '@env';
import { AdminStore } from '../../MobX/Admin/Admin';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';

const GoogleSpeechToText = ({ audioPath }: { audioPath: string }) => {
    return new Promise(async (resolve, reject) => {
        try {
            const wavFilePath = `${RNFS.CachesDirectoryPath}/tutorAI.wav`;
            const command = `-i ${audioPath} -vn -acodec pcm_s16le -ar 16000 -ac 1 -b:a 256k -y ${wavFilePath}`;

            const session = await FFmpegKit.execute(command);
            const returnCode = await session.getReturnCode();

            if (ReturnCode.isSuccess(returnCode)) {
                const exists = await RNFS.exists(wavFilePath);

                if (exists) {
                    const audioFileBase64 = await fs.readFile(
                        wavFilePath,
                        'base64',
                    );

                    const googleCloudKey =
                        AdminStore.admin_data?.google_cloud_key || '';

                    const config = {
                        encoding: 'LINEAR16',
                        sampleRateHertz: 16000,
                        languageCode: 'en-US',
                        enableAutomaticPunctuation: true,
                        model: 'default',
                    };
                    const requestData = {
                        config: config,
                        audio: {
                            content: audioFileBase64,
                        },
                    };

                    const response = await Axios.post(
                        `${GOOGLE_STT_LINK}${googleCloudKey}`,
                        requestData,
                    );

                    const transcription =
                        response.data.results[0].alternatives[0].transcript;

                    resolve(transcription);
                } else {
                    reject();
                }
            } else {
                reject();
            }
        } catch (_error) {
            reject();
        }
    });
};

export { GoogleSpeechToText };
