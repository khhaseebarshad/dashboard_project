import matplotlib
matplotlib.use('Agg')
matplotlib.rcParams['axes.titlepad'] = 15

from matplotlib.figure import Figure
import seaborn as sns
import io
import numpy as np
import pandas as pd

# Theme configurations mapping visual tokens to Matplotlib properties
THEME_CONFIGS = {
    'dark': {
        'primary': '#6366f1', # Indigo
        'spine_color': '#475569',
        'tick_color': '#94a3b8',
        'grid_color': '#cbd5e1',
        'grid_alpha': 0.15,
        'label_color': '#cbd5e1',
        'title_color': '#f1f5f9',
        'legend_bg': '#1e293b',
        'legend_border': '#475569',
        'gender_colors': {'Male': '#6366f1', 'Female': '#ec4899'},
        'palette': ['#6366f1', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#f43f5e', '#14b8a6', '#f97316']
    },
    'light': {
        'primary': '#2563eb', # Royal Blue
        'spine_color': '#cbd5e1',
        'tick_color': '#64748b',
        'grid_color': '#64748b',
        'grid_alpha': 0.12,
        'label_color': '#334155',
        'title_color': '#0f172a',
        'legend_bg': '#ffffff',
        'legend_border': '#cbd5e1',
        'gender_colors': {'Male': '#2563eb', 'Female': '#db2777'},
        'palette': ['#2563eb', '#10b981', '#d97706', '#dc2626', '#7c3aed', '#06b6d4', '#db2777', '#f43f5e', '#14b8a6', '#f97316']
    },
    'cyberpunk': {
        'primary': '#ff007f', # Hot Pink
        'spine_color': '#00f2fe', # Neon Cyan
        'tick_color': '#bd00ff', # Toxic Purple
        'grid_color': '#00f2fe',
        'grid_alpha': 0.2,
        'label_color': '#00f2fe',
        'title_color': '#ffffff',
        'legend_bg': '#0d0d12',
        'legend_border': '#ff007f',
        'gender_colors': {'Male': '#00f2fe', 'Female': '#ff007f'},
        'palette': ['#ff007f', '#00f2fe', '#39ff14', '#ffea00', '#bd00ff', '#00f2fe', '#ff007f', '#39ff14', '#ffea00', '#bd00ff']
    }
}

def apply_custom_theme(fig, ax, theme='dark'):
    """
    Applies a consistent, premium dark or light theme to the plot.
    Sets backgrounds to transparent so they blend into the glassmorphic cards.
    """
    cfg = THEME_CONFIGS.get(theme, THEME_CONFIGS['dark'])
    
    fig.patch.set_facecolor('none')
    fig.patch.set_alpha(0.0)
    
    if ax:
        ax.patch.set_facecolor('none')
        ax.patch.set_alpha(0.0)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_color(cfg['spine_color'])
        ax.spines['bottom'].set_color(cfg['spine_color'])
        ax.tick_params(colors=cfg['tick_color'], labelsize=10)
        ax.yaxis.grid(True, linestyle='--', alpha=cfg['grid_alpha'], color=cfg['grid_color'])
        ax.xaxis.grid(False)
        ax.xaxis.label.set_color(cfg['label_color'])
        ax.yaxis.label.set_color(cfg['label_color'])
        ax.title.set_color(cfg['title_color'])
        ax.title.set_weight('bold')
        ax.title.set_size(13)

def get_empty_plot_bytes(message="No data matches the active filters", theme='dark'):
    """
    Generates a placeholder image when the filtered data is empty.
    """
    cfg = THEME_CONFIGS.get(theme, THEME_CONFIGS['dark'])
    fig = Figure(figsize=(6, 4))
    ax = fig.subplots()
    apply_custom_theme(fig, ax, theme)
    ax.text(0.5, 0.5, message, color=cfg['tick_color'], ha='center', va='center', fontsize=12, weight='bold')
    ax.set_xticks([])
    ax.set_yticks([])
    ax.spines['left'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    
    buf = io.BytesIO()
    fig.tight_layout()
    fig.savefig(buf, format='png', dpi=120, bbox_inches='tight', facecolor='none')
    buf.seek(0)
    return buf.getvalue()

# 1. Pie Chart - Gender Distribution
def generate_pie_chart(df, theme='dark'):
    if df.empty:
        return get_empty_plot_bytes(theme=theme)
        
    gender_counts = df['gender'].value_counts()
    if gender_counts.empty:
        return get_empty_plot_bytes(theme=theme)
        
    cfg = THEME_CONFIGS.get(theme, THEME_CONFIGS['dark'])
    labels = list(gender_counts.index)
    colors = [cfg['gender_colors'].get(l, '#10b981') for l in labels]
    
    fig = Figure(figsize=(6, 4))
    ax = fig.subplots()
    apply_custom_theme(fig, None, theme)
    
    wedges, texts, autotexts = ax.pie(
        gender_counts, 
        labels=labels, 
        autopct='%1.1f%%', 
        startangle=90, 
        colors=colors,
        textprops=dict(color=cfg['label_color'], size=10),
        wedgeprops=dict(width=0.4, edgecolor=cfg['spine_color'], linewidth=2) # Donut chart
    )
    
    for autotext in autotexts:
        autotext.set_color('#ffffff')
        autotext.set_weight('bold')
        
    ax.set_title("Gender Distribution")
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=120, bbox_inches='tight', facecolor='none')
    buf.seek(0)
    return buf.getvalue()

# 2. Histogram - Age Distribution
def generate_histogram(df, theme='dark'):
    if df.empty:
        return get_empty_plot_bytes(theme=theme)
        
    cfg = THEME_CONFIGS.get(theme, THEME_CONFIGS['dark'])
    fig = Figure(figsize=(6, 4))
    ax = fig.subplots()
    apply_custom_theme(fig, ax, theme)
    
    sns.histplot(data=df, x='age', kde=True, ax=ax, color=cfg['primary'], edgecolor=cfg['spine_color'], bins=12, alpha=0.6)
    ax.set_title("Age Distribution of Athletes")
    ax.set_xlabel("Age (years)")
    ax.set_ylabel("Count")
    
    buf = io.BytesIO()
    fig.tight_layout()
    fig.savefig(buf, format='png', dpi=120, bbox_inches='tight', facecolor='none')
    buf.seek(0)
    return buf.getvalue()

# 3. Line Chart - Average height by Birth Year
def generate_line_chart(df, theme='dark'):
    if df.empty or 'birth_year' not in df.columns or 'height' not in df.columns:
        return get_empty_plot_bytes(theme=theme)
        
    year_trend = df.groupby('birth_year')['height'].mean().reset_index()
    if year_trend.empty:
        return get_empty_plot_bytes(theme=theme)
        
    cfg = THEME_CONFIGS.get(theme, THEME_CONFIGS['dark'])
    line_color = cfg['palette'][1] if len(cfg['palette']) > 1 else cfg['primary']
    
    fig = Figure(figsize=(6, 4))
    ax = fig.subplots()
    apply_custom_theme(fig, ax, theme)
    
    sns.lineplot(data=year_trend, x='birth_year', y='height', ax=ax, color=line_color, linewidth=2.5, marker='o', markersize=5)
    ax.fill_between(year_trend['birth_year'], year_trend['height'], color=line_color, alpha=0.1)
    
    ax.set_title("Average Athlete Height by Birth Year")
    ax.set_xlabel("Birth Year")
    ax.set_ylabel("Average Height (cm)")
    
    buf = io.BytesIO()
    fig.tight_layout()
    fig.savefig(buf, format='png', dpi=120, bbox_inches='tight', facecolor='none')
    buf.seek(0)
    return buf.getvalue()

# 4. Bar Chart - Top 10 Countries by Athlete Count
def generate_bar_chart(df, theme='dark'):
    if df.empty:
        return get_empty_plot_bytes(theme=theme)
        
    country_counts = df['country'].value_counts().head(10).reset_index()
    country_counts.columns = ['country', 'count']
    if country_counts.empty:
        return get_empty_plot_bytes(theme=theme)
        
    cfg = THEME_CONFIGS.get(theme, THEME_CONFIGS['dark'])
    fig = Figure(figsize=(6, 4))
    ax = fig.subplots()
    apply_custom_theme(fig, ax, theme)
    
    sns.barplot(data=country_counts, x='count', y='country', hue='country', ax=ax, palette=cfg['palette'], legend=False, edgecolor=cfg['spine_color'], width=0.6)
    
    # Add counts to the right of bars
    for p in ax.patches:
        width = p.get_width()
        if not np.isnan(width) and width > 0:
            ax.annotate(f"{int(width)}", 
                        (width + (width * 0.02), p.get_y() + p.get_height() / 2.), 
                        ha='left', va='center', 
                        color=cfg['label_color'], weight='bold', size=9)
                        
    ax.set_title("Top 10 Represented Countries")
    ax.set_xlabel("Athlete Count")
    ax.set_ylabel("Country")
    
    buf = io.BytesIO()
    fig.tight_layout()
    fig.savefig(buf, format='png', dpi=120, bbox_inches='tight', facecolor='none')
    buf.seek(0)
    return buf.getvalue()

# 5. Scatter Plot - Height vs Weight (colored by Gender)
def generate_scatter_plot(df, theme='dark'):
    if df.empty:
        return get_empty_plot_bytes(theme=theme)
        
    cfg = THEME_CONFIGS.get(theme, THEME_CONFIGS['dark'])
    fig = Figure(figsize=(6, 4))
    ax = fig.subplots()
    apply_custom_theme(fig, ax, theme)
    
    sns.scatterplot(
        data=df, x='height', y='weight', hue='gender', 
        palette=cfg['gender_colors'], 
        alpha=0.6, s=40, ax=ax, edgecolor=cfg['spine_color'], linewidth=0.5
    )
    
    ax.set_title("Height vs. Weight Distribution")
    ax.set_xlabel("Height (cm)")
    ax.set_ylabel("Weight (kg)")
    
    # Custom Legend
    legend = ax.legend(frameon=True, facecolor=cfg['legend_bg'], edgecolor=cfg['legend_border'])
    if legend:
        for text in legend.get_texts():
            text.set_color(cfg['title_color'])
            
    buf = io.BytesIO()
    fig.tight_layout()
    fig.savefig(buf, format='png', dpi=120, bbox_inches='tight', facecolor='none')
    buf.seek(0)
    return buf.getvalue()

# 6. Box Plot - Weight distribution by Gender
def generate_box_plot(df, theme='dark'):
    if df.empty:
        return get_empty_plot_bytes(theme=theme)
        
    cfg = THEME_CONFIGS.get(theme, THEME_CONFIGS['dark'])
    fig = Figure(figsize=(6, 4))
    ax = fig.subplots()
    apply_custom_theme(fig, ax, theme)
    
    sns.boxplot(
        data=df, x='gender', y='weight', hue='gender', ax=ax, 
        palette=cfg['gender_colors'], legend=False,
        linewidth=1.5,
        flierprops=dict(marker='o', markerfacecolor=cfg['primary'], markersize=4, linestyle='none', markeredgecolor='none')
    )
    
    ax.set_title("Weight Spread by Gender")
    ax.set_xlabel("Gender")
    ax.set_ylabel("Weight (kg)")
    
    buf = io.BytesIO()
    fig.tight_layout()
    fig.savefig(buf, format='png', dpi=120, bbox_inches='tight', facecolor='none')
    buf.seek(0)
    return buf.getvalue()

# 7. Heatmap - Correlation Matrix of features (Age, Height, Weight)
def generate_heatmap(df, theme='dark'):
    if df.empty:
        return get_empty_plot_bytes(theme=theme)
        
    cfg = THEME_CONFIGS.get(theme, THEME_CONFIGS['dark'])
    fig = Figure(figsize=(6, 4.5))
    ax = fig.subplots()
    apply_custom_theme(fig, ax, theme)
    
    # Extract numerical columns for correlation
    corr_df = df[['age', 'height', 'weight']]
    corr = corr_df.corr()
    
    sns.heatmap(
        corr, cmap='coolwarm', vmin=-1.0, vmax=1.0, center=0,
        square=True, linewidths=.5, cbar_kws={"shrink": .8}, ax=ax, annot=True,
        annot_kws={'size': 10, 'weight': 'bold', 'color': '#ffffff'}, fmt='.2f'
    )
    
    # Configure colorbar labels
    if ax.collections:
        cbar = ax.collections[0].colorbar
        if cbar:
            cbar.ax.tick_params(colors=cfg['label_color'])
            
    ax.set_title("Attribute Correlation Matrix")
    
    buf = io.BytesIO()
    fig.tight_layout()
    fig.savefig(buf, format='png', dpi=120, bbox_inches='tight', facecolor='none')
    buf.seek(0)
    return buf.getvalue()

# 8. Area Chart - Cumulative athlete count by Birth Year
def generate_area_chart(df, theme='dark'):
    if df.empty or 'birth_year' not in df.columns:
        return get_empty_plot_bytes(theme=theme)
        
    year_counts = df['birth_year'].value_counts().sort_index().reset_index()
    year_counts.columns = ['birth_year', 'count']
    year_counts['cumulative'] = year_counts['count'].cumsum()
    
    cfg = THEME_CONFIGS.get(theme, THEME_CONFIGS['dark'])
    area_color = cfg['palette'][4] if len(cfg['palette']) > 4 else cfg['primary']
    
    fig = Figure(figsize=(6, 4))
    ax = fig.subplots()
    apply_custom_theme(fig, ax, theme)
    
    ax.plot(year_counts['birth_year'], year_counts['cumulative'], color=area_color, linewidth=2.5, marker='o', markersize=4)
    ax.fill_between(year_counts['birth_year'], year_counts['cumulative'], color=area_color, alpha=0.2)
    
    ax.set_title("Cumulative Athlete Count by Birth Year")
    ax.set_xlabel("Birth Year")
    ax.set_ylabel("Cumulative Athlete Count")
    
    buf = io.BytesIO()
    fig.tight_layout()
    fig.savefig(buf, format='png', dpi=120, bbox_inches='tight', facecolor='none')
    buf.seek(0)
    return buf.getvalue()

# 9. Count Plot - Top 5 disciplines count split by Gender
def generate_count_plot(df, theme='dark'):
    if df.empty:
        return get_empty_plot_bytes(theme=theme)
        
    # Get top 5 disciplines overall
    top_discs = df['disciplines'].value_counts().head(5).index
    plot_df = df[df['disciplines'].isin(top_discs)].copy()
    
    if plot_df.empty:
        return get_empty_plot_bytes(theme=theme)
        
    cfg = THEME_CONFIGS.get(theme, THEME_CONFIGS['dark'])
    fig = Figure(figsize=(6, 4))
    ax = fig.subplots()
    apply_custom_theme(fig, ax, theme)
    
    sns.countplot(
        data=plot_df, y='disciplines', hue='gender', 
        order=top_discs, palette=cfg['gender_colors'], 
        ax=ax, edgecolor=cfg['spine_color'], width=0.6
    )
    
    # Add values to the right of bars
    for p in ax.patches:
        width = p.get_width()
        if not np.isnan(width) and width > 0:
            ax.annotate(f"{int(width)}", 
                        (width + 3, p.get_y() + p.get_height() / 2.), 
                        ha='left', va='center', 
                        color=cfg['label_color'], weight='bold', size=8)
                        
    ax.set_title("Top 5 Disciplines by Gender")
    ax.set_xlabel("Count")
    ax.set_ylabel("Discipline")
    
    # Legend style
    legend = ax.legend(frameon=True, facecolor=cfg['legend_bg'], edgecolor=cfg['legend_border'])
    if legend:
        for text in legend.get_texts():
            text.set_color(cfg['title_color'])
            
    buf = io.BytesIO()
    fig.tight_layout()
    fig.savefig(buf, format='png', dpi=120, bbox_inches='tight', facecolor='none')
    buf.seek(0)
    return buf.getvalue()

# 10. Violin Plot - Height distribution by Gender
def generate_violin_plot(df, theme='dark'):
    if df.empty:
        return get_empty_plot_bytes(theme=theme)
        
    cfg = THEME_CONFIGS.get(theme, THEME_CONFIGS['dark'])
    fig = Figure(figsize=(6, 4))
    ax = fig.subplots()
    apply_custom_theme(fig, ax, theme)
    
    sns.violinplot(
        data=df, x='gender', y='height', hue='gender', ax=ax, 
        palette=cfg['gender_colors'], legend=False, 
        linewidth=1.5, inner='quartile'
    )
    
    ax.set_title("Height Demographics by Gender")
    ax.set_xlabel("Gender")
    ax.set_ylabel("Height (cm)")
    
    buf = io.BytesIO()
    fig.tight_layout()
    fig.savefig(buf, format='png', dpi=120, bbox_inches='tight', facecolor='none')
    buf.seek(0)
    return buf.getvalue()
