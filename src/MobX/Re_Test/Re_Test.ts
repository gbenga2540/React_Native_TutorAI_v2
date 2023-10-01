import { action, makeObservable, observable } from 'mobx';

class ReTestClass {
    testCount: number = 1;
    isTakingTest: boolean = false;

    constructor() {
        makeObservable(this, {
            testCount: observable,
            isTakingTest: observable,
            start_test: action,
            disable_re_test: action,
            retake_test: action,
            reset_retake: action,
        });
    }

    start_test = () => {
        this.isTakingTest = true;
    };

    disable_re_test = () => {
        this.isTakingTest = false;
    };

    retake_test = () => {
        this.testCount += 1;
    };

    reset_retake = () => {
        this.testCount = 1;
        this.isTakingTest = false;
    };
}

export const ReTestStore = new ReTestClass();
