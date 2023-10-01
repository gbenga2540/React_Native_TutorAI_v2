import React, { FunctionComponent, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeTab from '../Home_Tab/Home_Tab';
import SubscriptionPage from '../../Screens/Subscription_Page/Subscription_Page';
import SelectPaymentPage from '../../Screens/Select_Payment_Page/Select_Payment_Page';
import AddPaymentPage from '../../Screens/Add_Payment_Page/Add_Payment_Page';
import ParentalControlPage from '../../Screens/Parental_Control_Page/Parental_Control_Page';
import PersonalDetailsPage from '../../Screens/Personal_Details_Page/Personal_Details_Page';
import AvatarCustomizationPage from '../../Screens/Avatar_Customization_Page/Avatar_Customization_Page';
import CustomizeVoicePage from '../../Screens/Customize_Voice_Page/Customize_Voice_Page';
import HelpCenterPage from '../../Screens/Help_Center_Page/Help_Center_Page';
import ReportPage from '../../Screens/Report_Page/Report_Page';
import VocabularyPage from '../../Screens/Vocabulary_Page/Vocabulary_Page';
import GlossaryPage from '../../Screens/Glossary_Page/Glossary_Page';
import LessonArchivePage from '../../Screens/Lesson_Archive_Page/Lesson_Archive_Page';
import HomeWorkArchivePage from '../../Screens/Home_Work_Archive_Page/Home_Work_Archive_Page';
import ScheduleClassPage from '../../Screens/Schedule_Class_Page/Schedule_Class_Page';
import ExamArchivePage from '../../Screens/Exam_Archive_Page/Exam_Archive_Page';
import VerifyOTPPage from '../../Screens/Verify_OTP_Page/Verify_OTP_Page';
import HomeWorkQPage from '../../Screens/Home_Work_Q_Page/Home_Work_Q_Page';
import CongratulationsPage from '../../Screens/Congratulations_Page/Congratulations_Page';
import ExamQPage from '../../Screens/Exam_Q_Page/Exam_Q_Page';
import ExamWPage from '../../Screens/Exam_W_Page/Exam_W_Page';
import SpeechControllerPage from '../../Screens/Speech_Controller_Page/Speech_Controller_Page';
import LockAppsPage from '../../Screens/Lock_Apps_Page/Lock_Apps_Page';
import ReviewPage from '../../Screens/Review_Page/Review_Page';
import UnsubscribePage from '../../Screens/Unsubscribe_Page/Unsubscribe_Page';
import LGrammarPage from '../../Screens/L_Grammar_Page/L_Grammar_Page';
import LReadingPage from '../../Screens/L_Reading_Page/L_Reading_Page';
import LWritingPage from '../../Screens/L_Writing_Page/L_Writing_Page';
import LConversationPage from '../../Screens/L_Conversation_Page/L_Conversation_Page';
import ExtraPaymentPage from '../../Screens/Extra_Payment_Page/Extra_Payment_Page';
import { useQuery, useQueryClient } from 'react-query';
import { QueryTags } from '../../Configs/Queries/Query_Tags/Query_Tags';
import { get_lesson_topics } from '../../Configs/Queries/LessonTopics/LessonTopics';
import { LessonTopicsStore } from '../../MobX/Lesson_Topics/Lesson_Topics';
import { Platform, View } from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import OverlaySpinner from '../../Components/Overlay_Spinner/Overlay_Spinner';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import BasicButton from '../../Components/Basic_Button/Basic_Button';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import { observer } from 'mobx-react';

type HomeStackParamList = {
    HomeTab: {};
    SubscriptionPage: {};
    SelectPaymentPage: {};
    AddPaymentPage: {};
    ParentalControlPage: {};
    PersonalDetailsPage: {};
    AvatarCustomizationPage: {};
    CustomizeVoicePage: {};
    HelpCenterPage: {};
    ReportPage: {};
    VocabularyPage: {};
    GlossaryPage: {};
    LessonArchivePage: {};
    HomeWorkArchivePage: {};
    LessonConvPage: {};
    ScheduleClassPage: {};
    ExamArchivePage: {};
    VerifyOTPPage: {};
    HomeWorkQPage: {};
    CongratulationsPage: {};
    ExamQPage: {};
    ExamWPage: {};
    SpeechControllerPage: {};
    LockAppsPage: {};
    ReviewPage: {};
    UnsubscribePage: {};
    LGrammarPage: {};
    LReadingPage: {};
    LWritingPage: {};
    LConversationPage: {};
    ExtraPaymentPage: {};
};

const Home_Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStack: FunctionComponent = observer(() => {
    const queryClient = useQueryClient();

    const { data, isError, refetch, isLoading } = useQuery(
        QueryTags({})?.LessonTopics,
        get_lesson_topics,
        {
            refetchIntervalInBackground: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            refetchOnWindowFocus: false,
        },
    );

    const refetch_data = no_double_clicks({
        execFunc: () => {
            refetch();
            queryClient.invalidateQueries(QueryTags({}).LessonTopics);
        },
    });

    useEffect(() => {
        if (!data?.error && data?.data?.length > 0) {
            LessonTopicsStore.set_lesson_topics({ data: data?.data });
        }
    }, [data]);

    if (LessonTopicsStore.all_topics?.length > 0) {
        return (
            <Home_Stack.Navigator
                initialRouteName={'HomeTab'}
                screenOptions={{
                    headerShown: false,
                }}>
                <Home_Stack.Screen name="HomeTab" component={HomeTab} />
                <Home_Stack.Screen
                    name="SubscriptionPage"
                    component={SubscriptionPage}
                />
                <Home_Stack.Screen
                    name="SelectPaymentPage"
                    component={SelectPaymentPage}
                />
                <Home_Stack.Screen
                    name="AddPaymentPage"
                    component={AddPaymentPage}
                />
                <Home_Stack.Screen
                    name="ParentalControlPage"
                    component={ParentalControlPage}
                />
                <Home_Stack.Screen
                    name="PersonalDetailsPage"
                    component={PersonalDetailsPage}
                />
                <Home_Stack.Screen
                    name="AvatarCustomizationPage"
                    component={AvatarCustomizationPage}
                />
                <Home_Stack.Screen
                    name="CustomizeVoicePage"
                    component={CustomizeVoicePage}
                />
                <Home_Stack.Screen
                    name="HelpCenterPage"
                    component={HelpCenterPage}
                />
                <Home_Stack.Screen name="ReportPage" component={ReportPage} />
                <Home_Stack.Screen
                    name="VocabularyPage"
                    component={VocabularyPage}
                />
                <Home_Stack.Screen
                    name="GlossaryPage"
                    component={GlossaryPage}
                />
                <Home_Stack.Screen
                    name="LessonArchivePage"
                    component={LessonArchivePage}
                />
                <Home_Stack.Screen
                    name="HomeWorkArchivePage"
                    component={HomeWorkArchivePage}
                />
                <Home_Stack.Screen
                    name="ScheduleClassPage"
                    component={ScheduleClassPage}
                />
                <Home_Stack.Screen
                    name="ExamArchivePage"
                    component={ExamArchivePage}
                />
                <Home_Stack.Screen
                    name="VerifyOTPPage"
                    component={VerifyOTPPage}
                />
                <Home_Stack.Screen
                    name="HomeWorkQPage"
                    component={HomeWorkQPage}
                />
                <Home_Stack.Screen
                    name="CongratulationsPage"
                    component={CongratulationsPage}
                />
                <Home_Stack.Screen name="ExamQPage" component={ExamQPage} />
                <Home_Stack.Screen name="ExamWPage" component={ExamWPage} />
                <Home_Stack.Screen
                    name="SpeechControllerPage"
                    component={SpeechControllerPage}
                />
                <Home_Stack.Screen
                    name="LockAppsPage"
                    component={LockAppsPage}
                />
                <Home_Stack.Screen name="ReviewPage" component={ReviewPage} />
                <Home_Stack.Screen
                    name="UnsubscribePage"
                    component={UnsubscribePage}
                />
                <Home_Stack.Screen
                    name="LGrammarPage"
                    component={LGrammarPage}
                />
                <Home_Stack.Screen
                    name="LReadingPage"
                    component={LReadingPage}
                />
                <Home_Stack.Screen
                    name="LWritingPage"
                    component={LWritingPage}
                />
                <Home_Stack.Screen
                    name="LConversationPage"
                    component={LConversationPage}
                />
                <Home_Stack.Screen
                    name="ExtraPaymentPage"
                    component={ExtraPaymentPage}
                />
            </Home_Stack.Navigator>
        );
    } else {
        if (isLoading) {
            return (
                <View
                    style={{
                        zIndex: 3,
                        flex: 1,
                        backgroundColor: Colors.Background,
                    }}>
                    <OverlaySpinner showSpinner={true} hideBackButton />
                </View>
            );
        } else {
            if (isError || data?.error) {
                return (
                    <View
                        style={{
                            zIndex: 2,
                            flex: 1,
                            backgroundColor: Colors.Background,
                        }}>
                        <View
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                            <BasicText
                                inputText={
                                    'An error occured while attempting to load the lessons!\nPlease make sure your are connected to the Internet and Try Again!'
                                }
                                width={270}
                                textAlign={'center'}
                            />
                        </View>
                        <BasicButton
                            execFunc={() => refetch_data({})}
                            buttonText="RELOAD"
                            marginHorizontal={22}
                            marginBottom={
                                Platform.OS === 'ios'
                                    ? screen_height_less_than({
                                          if_false: 35,
                                          if_true: 10,
                                      })
                                    : 20
                            }
                        />
                    </View>
                );
            } else {
                return <BasicText inputText="sjd sk" />;
            }
        }
    }
});

export default HomeStack;
