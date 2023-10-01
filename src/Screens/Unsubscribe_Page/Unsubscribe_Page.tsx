import React, { FunctionComponent, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import BackButton from '../../Components/Back_Button/Back_Button';
import BasicButton from '../../Components/Basic_Button/Basic_Button';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CustomStatusBar from '../../Components/Custom_Status_Bar/Custom_Status_Bar';
import OverlaySpinner from '../../Components/Overlay_Spinner/Overlay_Spinner';
import { error_handler } from '../../Utils/Error_Handler/Error_Handler';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { useMutation } from 'react-query';
import MultiLineTextEntry from '../../Components/Multi_Line_Text_Entry/Multi_Line_Text_Entry';
import { send_unsubscribe_reason } from '../../Configs/Queries/Unsubscribe/Unsubscribe';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';

const UnsubscribePage: FunctionComponent = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();

    const [reason, setReason] = useState<string>('');
    const [showSpinner, setShowSpinner] = useState<boolean>(false);
    const [disableButton, setDisableButton] = useState<boolean>(false);

    const { mutate: send_unsubscribe_reason_mutate } = useMutation(
        send_unsubscribe_reason,
        {
            onMutate: () => {
                setDisableButton(true);
                setShowSpinner(true);
            },
            onSettled: async data => {
                setShowSpinner(false);
                setDisableButton(false);
                if (data?.error) {
                    error_handler({
                        navigation: navigation,
                        error_mssg: 'An error occured!',
                        svr_error_mssg: data?.data,
                    });
                } else {
                    navigation.push(
                        'HomeStack' as never,
                        {
                            screen: 'VerifyOTPPage',
                        } as never,
                    );
                }
            },
        },
    );

    const upload_reason = no_double_clicks({
        execFunc: () => {
            if (reason) {
                send_unsubscribe_reason_mutate({
                    reason: reason,
                    userAuth: UserInfoStore?.user_info?.accessToken as string,
                });
            } else {
                error_handler({
                    navigation: navigation,
                    error_mssg: 'Input field cannot be empty!',
                });
            }
        },
    });

    return (
        <View style={styles.fp_main}>
            <CustomStatusBar
                showSpinner={showSpinner}
                backgroundColor={Colors.Background}
                backgroundDimColor={Colors.BackgroundDim}
            />
            <OverlaySpinner
                showSpinner={showSpinner}
                setShowSpinner={setShowSpinner}
            />
            <View
                style={{
                    marginLeft: 22,
                    marginTop: navigation?.canGoBack()
                        ? Platform.OS === 'ios'
                            ? 56
                            : 25
                        : Platform.OS === 'ios'
                        ? 70
                        : 25,
                    marginBottom: 15,
                }}>
                {navigation.canGoBack() && <BackButton />}
            </View>
            <View style={{ flex: 1 }}>
                <BasicText
                    inputText="Unsubscribe from TutorAI"
                    textWeight={700}
                    textSize={30}
                    marginLeft={22}
                    marginRight={22}
                    marginBottom={10}
                />
                <BasicText
                    inputText="Please input a reason as to why you are unsubscribing from TutorAI?"
                    textWeight={500}
                    textSize={16}
                    marginLeft={22}
                    marginRight={22}
                    textColor={Colors.Grey}
                />
                <MultiLineTextEntry
                    marginTop={20}
                    inputMode="text"
                    placeHolderText="Enter your reason here..."
                    inputValue={reason}
                    setInputValue={setReason}
                    marginBottom={18}
                    marginLeft={22}
                    marginRight={22}
                />
            </View>
            <KeyboardAvoidingView
                style={{ zIndex: 2 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <BasicButton
                    buttonText="Continue"
                    borderRadius={8}
                    marginHorizontal={22}
                    execFunc={() => upload_reason({})}
                    buttonHeight={56}
                    disabled={disableButton}
                    marginBottom={
                        Platform.OS === 'ios'
                            ? screen_height_less_than({
                                  if_true: 10,
                                  if_false: 40,
                              })
                            : 20
                    }
                />
            </KeyboardAvoidingView>
        </View>
    );
};

export default UnsubscribePage;

const styles = StyleSheet.create({
    fp_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
});
