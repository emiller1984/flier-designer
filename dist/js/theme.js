const updateTheme = (colors) => {
    const themeRoot = document.getElementById('theme-root');
    for (let name in colors) {
        if (isColor(colors[name])) {
            themeRoot.style.setProperty(`--${name}`, colors[name]);
        }
    }
}

const isColor = (colorStr) => {
    var s = new Option().style;
    s.color = colorStr;
    return s.color !== '';
}

export default updateTheme;