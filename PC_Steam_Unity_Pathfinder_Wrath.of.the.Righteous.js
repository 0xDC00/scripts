// ==UserScript==
// @name         Pathfinder: Wrath of the Righteous
// @version      
// @author       [DC]
// @description  Steam
// * Owlcat Games
// * Unity (JIT)
//
// https://store.steampowered.com/app/1184370/Pathfinder_Wrath_of_the_Righteous__Enhanced_Edition/
// ==/UserScript==

const Mono = require('./libMono.js');

const handlerLine = trans.send((s) => s, '250+');
const handlerLineLast = trans.send((s) => s, 500);

/* NPC talk+ */
// public void HandleOnShowBark(EntityDataBase unit, string text)
Mono.setHook('', 'Kingmaker.UI.Models.Log.Events.GameLogEventBark$EventsHandler', 'HandleOnShowBark', -1, {
    onEnter(args) {
        console.warn('onEnter: EventsHandler.HandleOnShowBark');
        const s = args[2].readMonoString();

        trans.send(s);
    }
});

/* Dialogue & Choice */
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
// private void SetAnswer(BlueprintAnswer answer)
Mono.setHook('', 'Kingmaker.UI.MVVM._PCView.Dialog.Dialog.DialogAnswerView', 'SetAnswer', -1, {
    onEnter(args) {
        console.warn('onEnter: DialogAnswerView.SetAnswer');
        this.thiz = args[0];
    },
    onLeave() {
        /** @type {Mono.MonoObjectWrapper} */
        const thiz = this.thiz.wrap();

        const s = thiz.AnswerText.getValue().wrap().get_text().readMonoString().replace(/<.*?>/g, '');

        setTimeout(() => handlerLine(s), 50);
    }
});

/* Journal */
Mono.setHook('', 'Kingmaker.UI.MVVM._VM.ServiceWindows.Journal.JournalQuestVM', '.ctor', -1, {
    onEnter(args) {
        console.warn('onEnter: new JournalQuestVM');
        this.thiz = args[0];
    },
    onLeave(retVal) {
        /** @type {Mono.MonoObjectWrapper} */
        const thiz = this.thiz.wrap();

        const title = thiz.Title.getValue().readMonoString().replace(/<.*?>/g, '');
        const desc = thiz.Description.getValue().readMonoString().replace(/<.*?>/g, '');
        const complete = thiz.CompletionText.getValue().readMonoString().replace(/<.*?>/g, '');

        let s = title + '\r\n' + desc;
        if (complete.length !== 0) {
            s += '\r\n' + complete;
        }

        const lst = thiz.Objectives.getValue().wrap();
        for (const item of lst) {
            const quest = item.wrap();

            const title = quest.Title.getValue().readMonoString().replace(/<.*?>/g, '');
            const desc = quest.Description.getValue().readMonoString().replace(/<.*?>/g, '');

            s += '\r\n\r\n- ' + title + '\r\n' + desc;

            const addendums = quest.Addendums.getValue().wrap();
            for (const item of addendums) {
                const quest = item.wrap();
                const desc = quest.Description.getValue().readMonoString().replace(/<.*?>/g, '');
                const done = quest.IsCompleted.getValue().value === false ? '[ ] ' : '[✓] ';
                s += '\r\n' + done + desc;
            }
        }

        trans.send(s);
    }
});

/* Encyclopedia */
// public EncyclopediaPageVM(IPage page)
Mono.setHook('', 'Kingmaker.UI.MVVM._VM.ServiceWindows.Encyclopedia.EncyclopediaPageVM', '.ctor', -1, {
    onEnter(args) {
        console.warn('onEnter: new EncyclopediaPageVM');
        const s = args[1].wrap().GetTitle().readMonoString();
        handlerLine(s);
    }
});
// EncyclopediaPageBlockTextVM.Text
Mono.setHook('', 'Kingmaker.UI.MVVM._VM.ServiceWindows.Encyclopedia.Blocks.EncyclopediaPageBlockTextVM', 'get_Text', -1, {
    onLeave(retVal) {
        console.warn('onEnter: EncyclopediaPageBlockTextVM .get_Text');
        const s = retVal.readMonoString().replace(/<.*?>/g, '');
        handlerLine(s);
    }
});

// public SettingsDescriptionVM(string title, string description)
Mono.setHook('', 'Kingmaker.UI.MVVM._VM.Settings.SettingsDescriptionVM', '.ctor', 2, {
    onEnter(args) {
        console.warn('onEnter: new SettingsDescriptionVM');
        const title = args[1].readMonoString();
        const description = args[2].readMonoString();

        const s = title + '\r\n' + description;
        handlerLineLast(s);
    }
});

// Kingmaker.UI.MVVM._VM.NewGame.Story.NewGamePhaseStoryVM SetStory (Kingmaker.Blueprints.Root.BlueprintCampaign story)
Mono.setHook('', 'Kingmaker.UI.MVVM._VM.NewGame.Story.NewGamePhaseStoryVM', 'SetStory', -1, {
    onEnter(args) {
        console.warn('onEnter: NewGamePhaseStoryVM');
        const story = args[1].wrap();
        const title = story.Title.getValue().wrap().ToString().readMonoString();
        const description = story.Description.getValue().wrap().ToString().readMonoString();
        const s = title + '\r\n' + description;
        handlerLineLast(s);
    }
});

/* Tooltip+ */
{
    let timer;
    function singleLine(s) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            handlerLine(s);
        }, 250);
    }

    // public TooltipBrickText(string text, TooltipTextType type = TooltipTextType.Simple)
    Mono.setHook('', 'Kingmaker.UI.MVVM._VM.Tooltip.Bricks.TooltipBrickText', '.ctor', -1, {
        onEnter(args) {
            console.warn('onEnter: new TooltipBrickText');
            const s = args[1].readMonoString().replace(/<.*?>/g, '');

            singleLine(s);
        }
    });
}
{
    let timer;
    function singleLine(s) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            handlerLine(s);
        }, 250);
    }

    // public TooltipBrickTitle(string title)
    Mono.setHook('', 'Kingmaker.UI.MVVM._VM.Tooltip.Bricks.TooltipBrickTitle', '.ctor', 1, {
        onEnter(args) {
            console.warn('onEnter: new TooltipBrickTitle');
            const s = args[1].readMonoString().replace(/<.*?>/g, '');

            singleLine(s);
        }
    });
    // public TooltipBrickTitle(string title, TooltipTitleType type, bool saberFormat = false)
    Mono.setHook('', 'Kingmaker.UI.MVVM._VM.Tooltip.Bricks.TooltipBrickTitle', '.ctor', 3, {
        onEnter(args) {
            console.warn('onEnter: new TooltipBrickTitle');
            const s = args[1].readMonoString().replace(/<.*?>/g, '');

            singleLine(s);
        }
    });
}