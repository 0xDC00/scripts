// ==UserScript==
// @name         Pathfinder: Kingmaker
// @version      
// @author       [DC]
// @description  Steam
// * Owlcat Games
// * Unity (JIT)
//
// https://store.steampowered.com/app/640820/Pathfinder_Kingmaker__Enhanced_Plus_Edition/
// ==/UserScript==

const Mono = require('./libMono.js');

const handlerLine = trans.send((s) => s, '250+');

// // public void AddGameHistoryLogMessage(string msg)
// Mono.setHook('', 'Kingmaker.GameStatistic', 'AddGameHistoryLogMessage', -1, {
//     onEnter(args) {
//         console.warn('onEnter: AddGameHistoryLogMessage');
//         const s = args[1].readMonoString();

//         console.error(s);
//     }
// });

/* NPC talk */
//// HandleOnShowBark
// public IBarkHandle ShowBark(EntityDataBase entity, string text, float duration, bool isLogging, VoiceOverStatus voiceOverStatus = null)
Mono.setHook('', 'Kingmaker.UI.Overtip.OvertipManager', 'ShowBark', -1, {
    onEnter(args) {
        console.warn('onEnter: OvertipManager.ShowBark');
        const s = args[2].readMonoString();

        trans.send(s);
    }
});

/* Dialogue + Choice */
// private void PlayBasicCue(BlueprintCue cue)
Mono.setHook('', 'Kingmaker.Controllers.Dialog.DialogController', 'PlayBasicCue', -1, {
    onEnter(args) {
        console.warn('onEnter: DialogController.PlayBasicCue');
        this.thiz = args[0];
        this.cue = args[1];
    },
    onLeave() {
        /** @type {Mono.MonoObjectWrapper} */
        const thiz = this.thiz.wrap();
        const cue = this.cue.wrap();

        const text = cue.get_DisplayText().wrap().ToString().readMonoString().replace(/<.*?>/g, '');
        const speaker = thiz.get_CurrentSpeakerName().readMonoString();
        let s = speaker === '' ? text : speaker + '\r\n' + text;

        // const m_Answers = thiz.get_Answers().wrap();
        // for (const item of m_Answers) {
        //     const answer = item.wrap();
        //     s += '\r\n - ' + answer.get_DisplayText().wrap().ToString().readMonoString().replace(/<.*?>/g, '');
        // }

        handlerLine(s);
    }
});
// choice (answer)
// public static string GetAnswerString(BlueprintAnswer answer, string bind, int index) // miss
// public void Initialize(int index, BlueprintAnswer answer)
Mono.setHook('', 'Kingmaker.UI.Dialog.TempOptionUI', 'Initialize', -1, {
    onEnter(args) {
        console.warn('onEnter: TempOptionUI.Initialize');
        this.thiz = args[0];
    },
    onLeave() {
        /** @type {Mono.MonoObjectWrapper} */
        const thiz = this.thiz.wrap();

        const s = thiz.OptionName.getValue().wrap().get_text().readMonoString().replace(/<.*?>/g, '');

        setTimeout(() => handlerLine(s), 50);
    }
});
Mono.setHook('', 'Kingmaker.UI._ConsoleUI.Dialog.DialogAnswerView', 'Initialize', -1, {
    onEnter(args) {
        console.warn('onEnter: DialogAnswerView.Initialize');
        this.thiz = args[0];
    },
    onLeave() {
        /** @type {Mono.MonoObjectWrapper} */
        const thiz = this.thiz.wrap();

        const s = thiz.m_AnswerText.getValue().wrap().get_text().readMonoString().replace(/<.*?>/g, '');

        setTimeout(() => handlerLine(s), 50);
    }
});
Mono.setHook('', 'Kingmaker.UI._ConsoleUI.Dialog.InterchapterAnswerView', 'Initialize', -1, {
    onEnter(args) {
        console.warn('onEnter: InterchapterAnswerView.Initialize');
        this.thiz = args[0];
    },
    onLeave() {
        /** @type {Mono.MonoObjectWrapper} */
        const thiz = this.thiz.wrap();

        const s = thiz.m_AnswerText.getValue().wrap().get_text().readMonoString().replace(/<.*?>/g, '');

        setTimeout(() => handlerLine(s), 50);
    }
});

/* Journal */
// public void Initialize(Quest quest)
Mono.setHook('', 'Kingmaker.UI.Journal.JournalQuestElement', 'Initialize', -1, {
    onEnter(args) {
        console.warn('onEnter: JournalQuestElement.Initialize');
        this.thiz = args[0];
    },
    onLeave() {
        /** @type {Mono.MonoObjectWrapper} */
        const thiz = this.thiz.wrap();

        const header = thiz.Header.getValue().wrap().get_text().readMonoString().replace(/<.*?>/g, '');
        const desc = thiz.Description.getValue().wrap().get_text().readMonoString().replace(/<.*?>/g, '');
        const s = header + '\r\n' + desc;

        handlerLine(s);
    }
});
// public void Initialize(QuestObjective objective)
Mono.setHook('', 'Kingmaker.UI.Journal.JournalQuestObjective', 'Initialize', -1, {
    onEnter(args) {
        console.warn('onEnter: JournalQuestObjective.Initialize');
        this.thiz = args[0];
    },
    onLeave() {
        /** @type {Mono.MonoObjectWrapper} */
        const thiz = this.thiz.wrap();

        const header = thiz.Header.getValue().wrap().get_text().readMonoString().replace(/<.*?>/g, '');
        const desc = thiz.Description.getValue().wrap().get_text().readMonoString().replace(/<.*?>/g, '');
        const s = '\r\n- ' + header + '\r\n' + desc;

        // JournalQuestAddendum.Initialize
        const addendums = thiz.m_Addendums.getValue().wrap();
        for (const item of addendums) {
            const quest = item.wrap();
            const desc = quest.m_Header.getValue().wrap().get_text().readMonoString().replace(/<.*?>/g, '');
            const done = quest.m_Complited.getValue().wrap()
                .get_gameObject().wrap()
                .get_activeInHierarchy().value === false ? '[ ] ' : '[✓] ';
            s += '\r\n' + done + desc;
        }

        setTimeout(() => handlerLine(s), 50);
    }
});

/* Encyclopedia */
// public override void Initialize(IContentView view, IPage blueprintPage, IBlock blueprintBlock)
Mono.setHook('', 'Kingmaker.UI.ServiceWindow.Encyclopedia.Blocks.EncyclopediaBlockPage', 'Initialize', -1, {
    onEnter(args) {
        console.warn('onEnter: EncyclopediaBlockPage.Initialize');
        const s = args[2].wrap().GetTitle().readMonoString(); // BlueprintEncyclopediaNode GetTitle

        handlerLine(s);
    }
});
// public string GetText()
Mono.setHook('', 'Kingmaker.Blueprints.Encyclopedia.Blocks.BlueprintEncyclopediaBlockText', 'GetText', -1, {
    onEnter(args) {
        console.warn('onEnter: BlueprintEncyclopediaBlockText.GetText');
    },
    onLeave(retVal) {
        const s = retVal.readMonoString().replace(/\n/g, '\r\n\r\n').replace(/<.*?>/g, '');

        handlerLine(s);
    }
});

// public void SetStory(NewGameRoot.StoryEntity story)
Mono.setHook('', 'Kingmaker.UI.LevelUp.NewGame.NewGameWinPhaseStory', 'SetStory', -1, {
    onEnter(args) {
        console.warn('onEnter: SetStory');
        const story = args[1].wrap();
        const title = story.Title.wrap().ToString().readMonoString();
        const desc = story.Description.wrap().ToString().readMonoString();
        const s = title + '\r\n' + desc;

        trans.send(s);
    }
});

/* Tooltip+ */
// public DescriptionBrick SetText(string text, TextAlignmentOptions align)
// public DescriptionBrick SetText(string text, int index, TextAlignmentOptions align) <--
Mono.setHook('', 'Kingmaker.UI.Tooltip.DescriptionBrick', 'SetText', 3, {
    onEnter(args) {
        console.warn('onEnter: SetText 3');
        const text = args[1].readMonoString();
        if (text.length === 0) return;
        const s = text.replace(/\n/g, '\r\n\r\n').replace(/<.*?>/g, '');

        handlerLine(s);
    }
});
// public DescriptionBrick SetText(string text)
// public DescriptionBrick SetText(string text, int index) <--
Mono.setHook('', 'Kingmaker.UI.Tooltip.DescriptionBrick', 'SetText', 'System.String,System.Int32', {
    onEnter(args) {
        console.warn('onEnter: SetText 2');
        const text = args[1].readMonoString();
        if (text.length === 0) return;
        const s = text.replace(/\n/g, '\r\n\r\n').replace(/<.*?>/g, '');

        handlerLine(s);
    }
});
// public DescriptionBrickPrerequisite AddOrEntry(string text, bool done)
Mono.setHook('', 'Kingmaker.UI.Tooltip.DescriptionBrickPrerequisite', 'AddOrEntry', -1, {
    onEnter(args) {
        console.warn('onEnter: DescriptionBrickPrerequisite.AddOrEntry');
        const text = args[1].readMonoString().replace(/<.*?>/g, '');
        const done = args[2].isNull() ? '[ ] ' : '[✓] ';
        const s = done + text;

        handlerLine(s);
    }
});