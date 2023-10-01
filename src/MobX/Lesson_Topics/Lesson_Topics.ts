import { action, makeObservable, observable } from 'mobx';
import { INTF_LessonTopics } from '../../Interface/Lesson/Lesson';

class LessonTopics {
    all_topics: INTF_LessonTopics[] = [];
    beginner_topics: INTF_LessonTopics[] = [];
    pre_intermediate_topics: INTF_LessonTopics[] = [];
    intermediate_topics: INTF_LessonTopics[] = [];
    upper_intermediate_topics: INTF_LessonTopics[] = [];
    confident_topics: INTF_LessonTopics[] = [];

    constructor() {
        makeObservable(this, {
            all_topics: observable,
            beginner_topics: observable,
            pre_intermediate_topics: observable,
            intermediate_topics: observable,
            upper_intermediate_topics: observable,
            confident_topics: observable,
            set_lesson_topics: action,
        });
    }

    set_lesson_topics = ({ data }: { data: INTF_LessonTopics[] }) => {
        const all_data = data?.sort((a, b) =>
            a.lesson_id > b.lesson_id ? 1 : a.lesson_id < b.lesson_id ? -1 : 0,
        );

        if (all_data?.length > 0) {
            this.all_topics = all_data;
            this.beginner_topics = all_data.filter(
                item => item?.lesson_id?.toString()?.[0] === '1',
            );
            this.pre_intermediate_topics = all_data.filter(
                item => item?.lesson_id?.toString()?.[0] === '2',
            );
            this.intermediate_topics = all_data.filter(
                item => item?.lesson_id?.toString()?.[0] === '3',
            );
            this.upper_intermediate_topics = all_data.filter(
                item => item?.lesson_id?.toString()?.[0] === '4',
            );
            this.confident_topics = all_data.filter(
                item => item?.lesson_id?.toString()?.[0] === '5',
            );
        }
    };
}

export const LessonTopicsStore = new LessonTopics();
