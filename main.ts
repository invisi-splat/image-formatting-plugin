import { App, Editor, MarkdownView, MarkdownRenderer, Plugin, PluginSettingTab, Setting } from "obsidian";

interface MyPluginSettings {
	padding: number;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	padding: 10 // i have no clue why i'm not allowed to put a semicolon at the end of this line
}

const colourMap = new Map<string, string>([
	["bl", "black"],
	["s", "silver"],
	["gr", "gray"],
	["w", "white"],
	["m", "maroon"],
	["r", "red"],
	["p", "purple"],
	["f", "fuchsia"],
	["g", "green"],
	["l", "lime"],
	["o", "olive"],
	["y", "yellow"],
	["n", "navy"],
	["b", "blue"],
	["t", "teal"],
	["a", "aqua"],
]);


export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		console.log("Load")
		this.registerMarkdownPostProcessor((element, context) => {
			const images = element.querySelectorAll<HTMLElement>("span.internal-embed"); // ????? .image-embed doesn't work at all
			for (let index = 0; index < images.length; index++) {
				let image = images.item(index);
				let settings = image.nextElementSibling;
				if (settings.nodeName.toLowerCase() === "code") {
					if (settings.innerHTML.charAt(0) === "/") {
						settings.innerHTML = settings.innerHTML.replace("/","");
						image.style.float = "none";
					} else {
						this.format(element, context, image, settings.innerHTML);
						settings.innerHTML = "";
					}
				}
			}
		});

		this.registerMarkdownPostProcessor((element, context) => {
			const codes = element.querySelectorAll<HTMLElement>("code");
			const pattern: RegExp = /(.*):(.*)/
			for (let index = 0; index < codes.length; index++) {
				let code = codes.item(index);
				if (code.innerHTML.charAt(0) === "/") {
					code.innerHTML = code.innerHTML.replace("/","");
				} else {
					if (pattern.exec(code.innerHTML)) {
						const wordColour: string = pattern.exec(code.innerHTML)[1];
						const content: string = pattern.exec(code.innerHTML)[2];
						this.colour(element, context, wordColour, content, code);
					}
				}
			}
		});

		this.addSettingTab(new SettingTab(this.app, this));
	}

	format(element: Element, context: any, image: HTMLElement, settings: string) {
		let s = settings.valueOf();
		switch (s.charAt(0).toLowerCase()) {
			case "r":
				s = "right";
				image.style.float = s;
				image.style.padding = this.settings.padding.toString() + "px";
				break;
			case "l":
				s = "left";
				image.style.float = s;
				image.style.padding = this.settings.padding.toString() + "px";
				break;
			case "c":
				image.style.display = "table";
				image.style.margin = "0 auto";
			default:
				image.style.display = "default";
				image.style.margin = "default";
				image.style.float = "none";
				break;
		}
	}

	colour(element: Element, context: any, wordColour: string, content: string, code: HTMLElement) {
		let colourSpan = element.createEl("span");
		colourSpan.innerHTML = content;
		if (colourMap.get(wordColour)) {
			colourSpan.style.color = colourMap.get(wordColour);
		} else {
			colourSpan.style.color = wordColour;
		}
		console.log(colourSpan)
		console.log(code)
		code.parentElement.insertBefore(colourSpan, code);
		code.innerHTML = "";
	}

	onunload() {
		//
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Image Formatting Plugin Settings'});

		new Setting(containerEl)
			.setName('Padding')
			.setDesc('Specify default padding of images in px')
			.addText(text => text
				.setPlaceholder('10')
				.setValue(this.plugin.settings.padding.toString())
				.onChange(async (value) => {
					this.plugin.settings.padding = parseFloat(value);
					await this.plugin.saveSettings();
				}));
	}
}
