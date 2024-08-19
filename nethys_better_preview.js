let observers = []
let nethysSearchShadowRoots = []
let nethysSearchShadowRootContainers = []
let nethysSearchElements = document.getElementsByTagName("nethys-search");

let isMouseEnteredPreview = false;
let isPreviewLocked = false;

let timesToDoTheCallback = 3;
let intervalID = undefined;

//  /////////////\\\\\\\\\\\\\\
//  ||||| Timer Functions |||||
//  \\\\\\\\\\\\\//////////////

let timerCallback = (clonePreview) => {
	timesToDoTheCallback = timesToDoTheCallback - 1;
	console.log(timesToDoTheCallback);

	// We check if the timeOut has reached 0
	// If it has, we lock the preview and cancel the interval
	if (timesToDoTheCallback === 0) {
		isPreviewLocked = true;
		resetInterval();
	}
	
	hightlightPreviewBorders(clonePreview);
}

//  /////////////\\\\\\\\\\\\\\
//  ||||| Style Functions |||||
//  \\\\\\\\\\\\\//////////////

let hightlightPreviewBorders = (clonePreview) => {
	let previewStyle = clonePreview.style

	if (isPreviewLocked && !clonePreview.classList.contains("previewLocked")) {
		previewStyle.setProperty("border-top-color", "#ffcf40");
		previewStyle.setProperty("box-shadow", "0 0 20px #ffcf40");
	} else if (!isPreviewLocked) {
		if (timesToDoTheCallback === 2) {
			console.log("ahhh");
			previewStyle.setProperty("border-bottom-color", "#ffcf40");
			console.log(previewStyle);
		} else if (timesToDoTheCallback === 1) {
			previewStyle.setProperty("border-right-color", "#ffcf40");
			previewStyle.setProperty("border-left-color", "#ffcf40");
		}
	}
}

//  /////////////\\\\\\\\\\\\\\
//  ||||| Event Functions |||||
//  \\\\\\\\\\\\\//////////////

let onMouseLeavingHref = (clonePreview) => {
	console.log("leaving href");
	if (isPreviewLocked) {
		return;
	}
	clonePreview.remove();
	resetInterval();

}

let onMouseOutOfPreview = (clonePreview) => {
	console.log("out of preview");
	if (!isMouseEnteredPreview) {
		return;
	}
	isPreviewLocked = false;
	clonePreview.remove();
	resetInterval();
}

let onMouseOverPreview = (clonePreview) => {
	isMouseEnteredPreview = true;
}

//  ////////////////\\\\\\\\\\\\\\\\
//  ||||| Behavioral Functions |||||
//  \\\\\\\\\\\\\\\\////////////////

let resetInterval = () => {
	timesToDoTheCallback = 3;
	clearInterval(intervalID);
	intervalID = undefined;
}

// From the clone preview, we extract the url used in the title element
// We get all <a> elements that uses this url as href 
// Then we add one event :
// - On mouseleave the a element, we remove the preview is the preview wasn't locked
let markRelatedLinkElements = (clonePreview) => {
	titleElement = clonePreview.getElementsByClassName("title")[0];

	// The title element is structured like this : <title><wrap div> <a> </wrap div></title>
	// We mark it to avoid mistaking the element for the original <a> tag
	previewLinkElement = titleElement.children[0].children[0];
	previewLinkElement.id = "previewLinkElement";
	
	// extracting a correct url for search
	// https://2e.aonprd.com/xx....xx will be the form extracted
	// We want only the xx...xx part
	urlSource = previewLinkElement.href;
	urlSource = urlSource.substring(22);

	nodeListOfLinks = document.querySelectorAll("a[href='"+ urlSource +"']");
	console.log("a[href='"+ urlSource +"']");
	console.log(nodeListOfLinks);
	for (let i = 0; i < nodeListOfLinks.length; ++i) {
		
		linkNode = nodeListOfLinks[i];
		// if the node is a element and is NOT the preview link element (we wisely marked :) )
		if (linkNode.nodeType === 1 && linkNode.id !== "previewLinkElement") {
			linkNode.addEventListener('mouseleave', (event) => {
				onMouseLeavingHref(clonePreview)
			});
		}
	}
}

// We clone the original preview, we add events to customize the behavior
// then we allow pointer event to allow interacting with them and finally we add them into the DOM
let transformPreview = (previewElement, indexOfShadowRootContainerElement) => {
	if (!previewElement) {
		return;
	}

	let idx = indexOfShadowRootContainerElement;

	let clonePreview = previewElement.cloneNode(true);
	clonePreview.id = "clonePreview";
	previewElement.remove();

	clonePreview.addEventListener('mouseleave', () => {
		onMouseOutOfPreview(clonePreview);
	});

	clonePreview.addEventListener('mouseover', () => {
		onMouseOverPreview(clonePreview);
	});


	markRelatedLinkElements(clonePreview);

	let previewStyle = clonePreview.style;
	previewStyle.setProperty("pointer-events", "auto");
	
	// There is some kind of "flush" in the nethys search container when we leave the link to a resource.
	// We need to trick it by adding a empty div that will be flushed instead of your clone.
	nethysSearchShadowRootContainers[idx].appendChild(document.createElement("div"));
	nethysSearchShadowRootContainers[idx].appendChild(clonePreview);

	// As soon as the cloned preview is appended to the DOM, we start the counter
	intervalID = setInterval(timerCallback, 1000, clonePreview)
}

// When a change is observed in the shadow root, this function is called
// If the change is a preview, it clones it and make it a "better" preview via transformPreview() method
let nethysObserverCallback = (mutationList, indexOfShadowRootContainerElement) => {
	if (mutationList[0].addedNodes.length === 0) {
		return;
	}

	let changedElement = mutationList[0].addedNodes[0];
	if (changedElement instanceof Element && changedElement.id === "preview") {
		transformPreview(changedElement, indexOfShadowRootContainerElement);
	}
}

for (let i = 0; i < nethysSearchElements.length; i++) {

	// If there is a nethys search element on the page and a shadow root to work with
	// then launch an observer to react at any changes within the shadow root
	if (nethysSearchElements[i] && nethysSearchElements[i].shadowRoot) {
		
		nethysSearchShadowRoots.push(nethysSearchElements[i].shadowRoot);
		nethysSearchShadowRootContainers.push(nethysSearchShadowRoots[i].firstChild);
		
		observers.push(new MutationObserver((mutationList) => {
			nethysObserverCallback(mutationList, i)
		}));
		observers[i].observe(nethysSearchShadowRoots[i], {
			childList: true,
			subtree: true,
		});
		console.log(`observing shadow root number ${i}`);
	}

}
