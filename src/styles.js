export const BORDER_RADIUS = 0
export const TEXTAREA_HEIGHT=100
export const isMobile = window.innerWidth < 600

const Palette = {
	gray1: 'hsl(233, 13%, 16%)', // primary text
  gray2: 'hsl(230, 8%, 45%)', // secondary text
  gray3: 'hsl(235, 8%, 55%)', // placeholder
  gray4: 'hsl(230, 10%, 65%)', // hint text
  gray5: 'hsl(240, 17%, 96%)', // backgrounds, borders
  gray6: 'hsl(240, 10%, 98%)', // backgrounds, borders
}

export const Colors = {
	textPrimary: Palette.gray1,
	textSecondary: Palette.gray2,
	textTertiary: Palette.gray4,
	background: Palette.gray5,
	background2: Palette.gray6,
}

const FontSizes = {
	h1: 20,
	body: 16,
	small: 14,
	hint: 12,
}

export const listStyles = {
	resultsHint: {
		color: Colors.textTertiary,
		fontSize: FontSizes.hint,
	},
	genrePills: {
		marginBottom: 10,
	},
	genrePill: {
		display: 'inline-block',
		marginRight: 5,
		userSelect: 'none',
		cursor: 'pointer',
		background: Palette.gray4,
		color: 'white',
		borderRadius: 3,
		padding: '3px 5px',
	},
  rating: {
		color: Colors.textSecondary,
		marginTop: 2,
  },
	image: {width: isMobile ? 80 : 100, backgroundColor: Colors.background},
	itemMainWrapper: {
    marginLeft: 16,
	},
  itemTitle: {
		display: 'block',
    fontSize: FontSizes.body,
    color: Colors.textPrimary,
  },
  itemGenre: {
		display: 'block',
		marginTop: 4,
    marginLeft: 16,
    // marginRight: 40,
    fontSize: FontSizes.small,
    color: Colors.textTertiary,
  },
}

export const styles = {
  title: {
    marginTop: 8,
		marginRight: 56,
    marginBottom: 8,
    color: Colors.textPrimary,
		fontWeight: 600,
    fontSize: FontSizes.h1,
  },
  description: {
    fontSize: FontSizes.body,
		width: '90%',
		height: TEXTAREA_HEIGHT,
		marginRight: 16,
    lineHeight: 1.4,
    color: Colors.textSecondary,
  },
	closeButton: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		transform: 'rotate(180deg)',
		width: 32,
		outline: 'none',
		height: 32,
		background: 'rgba(0, 0, 0, 0.0)',
		borderRadius: '50%',
		border: 'none',
	},
	closeIcon: {
		color: 'white',
		display: 'inline-block',
		top: 3,
		fontSize: 24,
		opacity: .9,
		position: 'relative',
	},
  fabWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
		height: 32,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
}
