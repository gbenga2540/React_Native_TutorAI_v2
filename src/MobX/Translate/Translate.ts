import { action, makeObservable, observable } from 'mobx';

class TranslateClass {
    t_word: string = '';
    t_show: boolean = false;

    constructor() {
        makeObservable(this, {
            t_word: observable,
            t_show: observable,
            translate_word: action,
            clear_translate: action,
        });
    }

    translate_word = ({ word }: { word: string }) => {
        this.t_word = word;
        this.t_show = true;
    };

    clear_translate = () => {
        this.t_word = '';
        this.t_show = false;
    };
}

export const TranslateStore = new TranslateClass();
