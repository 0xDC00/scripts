// ==UserScript==
// @name         Disco Elysium
// @version      
// @author       [DC]
// @description  Steam
// * ZA/UM
// * Unity (JIT)
//
// https://store.steampowered.com/app/632470/Disco_Elysium__The_Final_Cut/
// ==/UserScript==
const Mono = require('./libMono.js');

const handlerLine = trans.send((s) => s, '250+');
const handlerLineLast = trans.send((s) => s, 250);

/* Dialogue */
let skip = [];
// public FinalEntry(DialogueEntry entry, string spokenLine, string speakerName)
Mono.setHook('', '.FinalEntry', '.ctor', 3, {
    onEnter(args) {
        console.warn('onEnter: new FinalEntry 3');
        const spokenLine = args[2].readMonoString();
        // skip choiced
        if (skip.includes(spokenLine) === true) {
            skip.length = 0; // clear array
            return;
        }

        const speakerName = args[3].readMonoString();
        const s = speakerName + '\r\n' + spokenLine.replace(/\n+/g, ' ');
        handlerLine(s);
    }
});
// public FinalEntry(DialogueEntry entry, string spokenLine)
Mono.setHook('', '.FinalEntry', '.ctor', 2, {
    onEnter(args) {
        console.warn('onEnter: new FinalEntry 2');
        this.spokenLine = args[2].readMonoString();
        this.thiz = args[0];

    },
    onLeave() {
        // skip choiced
        const spokenLine = this.spokenLine;
        if (skip.includes(spokenLine) === true) {
            skip.length = 0; // clear array
            return;
        }
        const thiz = this.thiz.wrap();
        const speakerName = thiz.speakerName.getValue().readMonoString();
        const s = speakerName + '\r\n' + spokenLine.replace(/\n+/g, ' ');
        handlerLine(s);
    }
});


/* choice */
// public string FormatResponse(int counter, FinalResponseText response)
// public void OnConversationResponseMenu(Response[] responses)
Mono.setHook('', 'Sunshine.ConversationLogger', 'OnConversationResponseMenu', -1, {
    onEnter(args) {
        console.warn('onEnter: ConversationLogger.OnConversationResponseMenu');
        this.responses = args[1];
    },
    onLeave() {
        skip.length = 0;
        const result = [];
        let i = 1;
        const responses = this.responses.wrap();
        for (const response of responses) {
            const item = response.wrap();
            const text = item.formattedText.getValue().wrap().get_text().readMonoString().replace(/\n+/g, ' ');
            skip.push(text);
            result.push(i++ + '.- ' + text);
        }
        const s = result.join('\r\n');
        handlerLine(s);
    }
});
Mono.setHook('', 'DiscoPages.Elements.Dialogue.ConversationLoggerPageSystem', 'OnConversationResponseMenu', -1, {
    onEnter(args) {
        console.warn('onEnter: ConversationLoggerPageSystem.OnConversationResponseMenu');
        this.responses = args[1];
    },
    onLeave() {
        const result = [];
        const responses = this.responses.wrap();
        for (const response of responses) {
            const item = response.wrap();
            const text = item.formattedText.getValue().wrap().get_text().readMonoString().replace(/\n+/g, ' ');
            result.push(text);
        }
        skip = result;
        const s = result.length === 1 ? '- ' + result[0] : '- ' + result.join('\n- ');
        handlerLine(s);
    }
});

/* float bubble */
Mono.setHook('', '.FloatTemplate', 'set_text', -1, {
    onEnter(args) {
        console.warn('onEnter: FloatTemplate.set_text');
        const s = args[1].readMonoString();
        handlerLine(s);
    }
}); // all

/* Journal Task */
Mono.setHook('', 'Sunshine.Journal.JournalSubtasksController', 'ShowSubtasks', -1, {
    onEnter(args) {
        console.warn('onEnter: JournalSubtasksController.ShowSubtasks');
        const task = args[1].wrap();
        const title = task.get_LocalizedNameUpper().readMonoString();
        const desc = task.get_LocalizedDescription().readMonoString();
        let s = title + '\n' + desc;

        // sub
        const GainedSubtasks = task.GainedSubtasks.getValue().wrap().ToArray().wrap(); // ToArrray: prevent Collection was modified
        for (const sub of GainedSubtasks) {
            const task = sub.wrap();
            const title = task.get_LocalizedName().readMonoString();
            const desc = task.get_LocalizedDescription().readMonoString();
            s += '\n- ' + title + '\n' + desc;
        }

        handlerLineLast(s);
    }
});

/* Skills */
Mono.setHook('', '.CharacterSheetInfoPanel', 'ShowSkill', -1, {
    onEnter(args) {
        console.warn('onEnter: CharacterSheetInfoPanel.ShowSkill');
        this.thiz = args[0].wrap();
    },
    onLeave() {
        /** @type {Mono.MonoObjectWrapper} */
        const thiz = this.thiz.wrap();
        const title = thiz.smallTitleText.getValue().wrap().get_text().readMonoString();
        const textArea = thiz.textArea.getValue().wrap().get_text().readMonoString();
        const extraText = thiz.extraText.getValue().wrap().get_text().readMonoString().replace(/<.*?>/g, '');;
        const infoText = thiz.infoText.getValue().wrap().get_text().readMonoString();
        const bonusText = thiz.bonusText.getValue().wrap().get_text().readMonoString();
        const abilityValueText = thiz.abilityValueText.getValue().wrap().get_text().readMonoString();
        const s = title + '\n- ' + textArea + '\n' + extraText + '\n- ' + infoText + '\n- ' + bonusText + '\n- ' + abilityValueText;
        handlerLineLast(s);
    }
});

/* item picked */
// public static void HandleItemPickup(string itemName, InventoryItem item)
Mono.setHook('', '.Alterant', 'HandleItemPickup', -1, {
    onEnter(args) {
        console.warn('onEnter: Alterant.HandleItemPickup');
        const s = args[1].wrap().get_displayName().readMonoString();
        setTimeout(() => handlerLine(s), 250);
    }
});

Mono.setHook('', 'Sunshine.Metric.InventoryItem', 'get_description', -1, {
    onLeave(retVal) {
        console.warn('onEnter: InventoryItem.get_description');
        const s = retVal.readMonoString();
        handlerLineLast(s);
    }
});