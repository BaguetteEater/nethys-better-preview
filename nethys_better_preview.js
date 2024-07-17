let nethysSearchElement;
let nethysSearchShadowRoot;
let nethysSearchShadowRootContainer;
let nethysSearchElements = document.getElementsByTagName("nethys-search");

let isMouseEnteredPreview = false;

let onMouseLeavingHref = (clonePreview) => {
	clonePreview.remove()
}

let onMouseOutRemovePreview = (clonePreview) => {
	if (!isMouseEnteredPreview) {
		return;
	}
	clonePreview.remove();
}

let onMouseOver = (clonePreview) => {
	isMouseEnteredPreview = true;
}

// From the clone preview, we extract the url used in the title element
// We get all <a> elements that uses this url as href 
let searchForLinkElements = (clonePreview) => {
	titleElement = clonePreview.getElementsByClassName("title")[0];

	// The title element is structured like this : <title><wrap div> <a> </wrap div></title>
	previewLinkElement = titleElement.children[0].children[0];
	urlSource = previewLinkElement.getAttribute("href");

	return document.querySelectorAll("a[href='"+ urlStringSource +"']");
}

// We clone the original preview, we add events to customize the behavior
// then we allow pointer event to allow interacting with them and finally we add them into the DOM
let transformPreview = (previewElement) => {
	if (!previewElement) {
		return;
	}

	let clonePreview = previewElement.cloneNode(true);
	clonePreview.id = "clonePreview";
	previewElement.remove();

	clonePreview.addEventListener('mouseleave', () => {
		onMouseOutRemovePreview(clonePreview);
	});

	clonePreview.addEventListener('mouseover', () => {
		onMouseOver(clonePreview);
	});


	linkElements = searchForLinkElement(clonePreview)

	let previewStyle = clonePreview.style;
	previewStyle.setProperty("pointer-events", "auto");
	
	nethysSearchShadowRootContainer.appendChild(clonePreview);
}

// When a change is observed in the shadow root, this function is called
// If the change is a preview, it clones it and make it a "better" preview via transformPreview() method
let nethysObserverCallback = (mutationRecords) => {
	if (mutationRecords[0].addedNodes.length === 0) {
		return;
	}

	let changedElement = mutationRecords[0].addedNodes[0];
	if (changedElement instanceof Element && changedElement.id === "preview") {
		transformPreview(changedElement);
	}
}

// If there several nethys search elements, we isolate the one with no UI as it is the one which operates the preview feature
if (nethysSearchElements.length > 0) {
	let elementAttr;
	let noUiAttr;
	for (let i = 0; i < nethysSearchElements.length; i++) {
		elementAttr = nethysSearchElements[i].attributes;
		noUiAttr = elementAttr.getNamedItem("no-ui");

		if (noUiAttr && noUiAttr.value === "true") {
			nethysSearchElement = nethysSearchElements[i];
		}
	}
}

// If there is a no-UI nethys search element on the page and a shadow root to work with
// then launch an observer to react at any changes within the shadow root
if (nethysSearchElement && nethysSearchElement.shadowRoot) {
	nethysSearchShadowRoot = nethysSearchElement.shadowRoot;
	nethysSearchShadowRootContainer = nethysSearchShadowRoot.firstChild;
	let observer = new MutationObserver(nethysObserverCallback);
	observer.observe(nethysSearchElement.shadowRoot, {
		childList: true,
		subtree: true,
	});
	console.log("observing...");
}
