#!/usr/bin/env python3
"""
Keystone Diagram Generator - Enhanced Version

Creates two publication-quality diagrams for the Keystone paper:
1. Three-Layer Architecture Diagram
2. Federated Governance Diagram

Enhanced with:
- Refined typography and visual hierarchy
- Clearer annotations and flow indicators
- Professional academic styling
- Improved color accessibility

Author: Keystone Project
Date: March 2026
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle, RegularPolygon, Wedge, Polygon
from matplotlib.collections import PatchCollection
import numpy as np

# Set up publication-quality settings
plt.rcParams['font.family'] = 'serif'
plt.rcParams['font.size'] = 11
plt.rcParams['axes.linewidth'] = 0.5
plt.rcParams['figure.dpi'] = 300
plt.rcParams['text.usetex'] = False

# Color scheme - muted, academic palette
COLORS = {
    'autonomic': '#1a237e',       # Deep indigo
    'autonomic_light': '#3949ab',
    'immune': '#bf360c',          # Deep orange/amber
    'immune_light': '#e65100',
    'conscious': '#00695c',       # Teal
    'conscious_light': '#00897b',
    'background': '#fafafa',      # Off-white (better for print)
    'text_dark': '#212121',       # Near black
    'text_medium': '#424242',
    'text_light': '#FFFFFF',
    'accent': '#6a1b9a',          # Purple accent
    'arrow': '#00695c',
    'grid': '#e0e0e0',
}

# Governance principle colors - accessible palette
GOV_COLORS = {
    'fiduciary': '#2e7d32',       # Green
    'systemic': '#1565c0',        # Blue
    'social': '#d84315',          # Orange
    'epistemic': '#7b1fa2',       # Purple
    'safety': '#c62828',          # Red
    'adjudicator': '#37474f',     # Blue-grey
    'action': '#455a64',
    'cleared': '#2e7d32',
    'blocked': '#c62828',
    'escalated': '#ef6c00',
}


def create_architecture_diagram():
    """
    Create the Three-Layer Architecture diagram with enhanced styling.
    """
    fig, ax = plt.subplots(1, 1, figsize=(11, 13))
    fig.patch.set_facecolor(COLORS['background'])
    ax.set_facecolor(COLORS['background'])

    ax.set_xlim(0, 11)
    ax.set_ylim(0, 14)
    ax.axis('off')

    # Title block
    ax.text(0.5, 13.5, 'Keystone Three-Layer Architecture',
            fontsize=22, fontweight='bold', fontstyle='italic',
            color=COLORS['text_dark'], ha='left', va='top',
            fontfamily='serif')
    ax.text(0.5, 12.85, 'Continuous Learning with Constitutional Stability',
            fontsize=13, color=COLORS['text_medium'], ha='left', va='top',
            fontfamily='serif')

    # Subtle separator line
    ax.plot([0.5, 10.5], [12.5, 12.5], color=COLORS['grid'], linewidth=0.5)

    # Layer dimensions
    layer_width = 5.5
    layer_height = 0.48
    layer_gap = 0.06
    start_x = 2.5
    start_y = 1.2

    # Draw all 16 layers with tier groupings
    tiers = [
        {
            'name': 'AUTONOMIC FLOOR',
            'description': 'Frozen Base Language Geometry',
            'protection': 'requires_grad = False',
            'layers': list(range(0, 6)),
            'color': COLORS['autonomic'],
            'color_light': COLORS['autonomic_light'],
            'percentage': 37.5,
        },
        {
            'name': 'IMMUNE / CONSTITUTIONAL',
            'description': 'PackNet Masks + Steering Vectors',
            'protection': 'Binary Gradient Masks',
            'layers': list(range(6, 11)),
            'color': COLORS['immune'],
            'color_light': COLORS['immune_light'],
            'percentage': 31.25,
        },
        {
            'name': 'CONSCIOUS / OPERATIONAL',
            'description': 'Freely Trainable LoRA Adapters',
            'protection': 'No Protection',
            'layers': list(range(11, 16)),
            'color': COLORS['conscious'],
            'color_light': COLORS['conscious_light'],
            'percentage': 31.25,
        },
    ]

    current_y = start_y
    tier_boundaries = []  # Track tier boundaries for labels

    for tier in tiers:
        tier_start_y = current_y
        num_layers = len(tier['layers'])

        # Tier background box (subtle)
        tier_height = num_layers * (layer_height + layer_gap) + 0.3
        tier_box = FancyBboxPatch(
            (start_x - 0.2, tier_start_y - 0.15),
            layer_width + 0.4, tier_height,
            boxstyle="round,pad=0.02,rounding_size=0.15",
            facecolor=tier['color'],
            edgecolor='none',
            alpha=0.08
        )
        ax.add_patch(tier_box)

        # Draw each layer
        for i, layer_idx in enumerate(reversed(tier['layers'])):
            y = current_y + i * (layer_height + layer_gap)

            # Layer box
            box = FancyBboxPatch(
                (start_x, y), layer_width, layer_height,
                boxstyle="round,pad=0.01,rounding_size=0.08",
                facecolor=tier['color'],
                edgecolor='white',
                linewidth=0.8,
                alpha=0.92
            )
            ax.add_patch(box)

            # Layer number (left side)
            ax.text(start_x - 0.25, y + layer_height/2, f'{layer_idx}',
                    fontsize=9, fontweight='bold', color=COLORS['text_medium'],
                    ha='right', va='center', fontfamily='monospace')

            # Layer internal label
            if i == num_layers // 2:
                layer_range = f"L{tier['layers'][0]}-L{tier['layers'][-1]}"
                ax.text(start_x + layer_width/2, y + layer_height/2, layer_range,
                        fontsize=9, fontweight='bold', color='white',
                        ha='center', va='center', fontfamily='monospace', alpha=0.9)

        tier_end_y = current_y + num_layers * (layer_height + layer_gap) - layer_gap
        tier_boundaries.append({
            'name': tier['name'],
            'description': tier['description'],
            'protection': tier['protection'],
            'color': tier['color'],
            'percentage': tier['percentage'],
            'mid_y': (tier_start_y + tier_end_y) / 2,
            'start_y': tier_start_y,
            'end_y': tier_end_y,
        })

        current_y = tier_end_y + 0.4  # Gap between tiers

    # Right-side tier labels and info
    label_x = start_x + layer_width + 0.5

    for tb in tier_boundaries:
        mid_y = tb['mid_y']

        # Tier name
        ax.text(label_x, mid_y + 0.35, tb['name'],
                fontsize=11, fontweight='bold', color=tb['color'],
                ha='left', va='center', fontfamily='sans-serif')
        # Description
        ax.text(label_x, mid_y, tb['description'],
                fontsize=8, color=COLORS['text_medium'],
                ha='left', va='center', fontfamily='sans-serif')
        # Protection
        ax.text(label_x, mid_y - 0.35, tb['protection'],
                fontsize=7, color=COLORS['text_medium'],
                ha='left', va='center', fontfamily='monospace', style='italic')
        # Percentage
        ax.text(start_x + layer_width + 0.1, tb['start_y'] + (tb['end_y'] - tb['start_y'])/2,
                f'{tb["percentage"]:.1f}%',
                fontsize=10, fontweight='bold', color=tb['color'],
                ha='left', va='center', fontfamily='sans-serif')

    # Gradient flow indicator
    conscious_tier = tier_boundaries[2]
    arrow_x = start_x + layer_width/2
    arrow_y_start = conscious_tier['start_y'] + 0.2
    arrow_y_end = conscious_tier['end_y'] - 0.1

    # Vertical gradient arrow
    ax.annotate('', xy=(arrow_x, arrow_y_end), xytext=(arrow_x, arrow_y_start + 0.8),
                arrowprops=dict(arrowstyle='->', color=COLORS['arrow'],
                               lw=3, mutation_scale=20))

    # Gradient label
    ax.text(arrow_x + 0.8, conscious_tier['mid_y'] + 0.3, 'Gradient Updates',
            fontsize=9, fontweight='bold', color=COLORS['arrow'],
            ha='left', va='center', fontfamily='sans-serif', rotation=0)

    # Downward flow arrows for frozen/protected
    frozen_label_y = tier_boundaries[0]['mid_y']
    ax.annotate('', xy=(start_x - 0.8, frozen_label_y - 0.3),
                xytext=(start_x - 0.8, frozen_label_y + 0.3),
                arrowprops=dict(arrowstyle='<->', color=COLORS['text_medium'],
                               lw=1.5, mutation_scale=12))
    ax.text(start_x - 1.2, frozen_label_y, 'Forward\nPass',
            fontsize=7, color=COLORS['text_medium'],
            ha='right', va='center', fontfamily='sans-serif', linespacing=0.9)

    # Legend box at bottom
    legend_y = 0.5
    legend_items = [
        ('Frozen', COLORS['autonomic']),
        ('Protected', COLORS['immune']),
        ('Trainable', COLORS['conscious']),
    ]

    legend_start_x = 3
    for i, (label, color) in enumerate(legend_items):
        lx = legend_start_x + i * 2
        box = FancyBboxPatch(
            (lx, legend_y - 0.15), 0.3, 0.3,
            boxstyle="round,pad=0.01,rounding_size=0.05",
            facecolor=color,
            edgecolor='white',
            linewidth=0.5
        )
        ax.add_patch(box)
        ax.text(lx + 0.45, legend_y, label,
                fontsize=9, color=COLORS['text_dark'],
                ha='left', va='center', fontfamily='sans-serif')

    # Key insight callout
    insight_y = 0.1
    ax.text(5.5, insight_y,
            '* Only the Conscious layer receives gradient updates during training *',
            fontsize=9, fontstyle='italic', color=COLORS['accent'],
            ha='center', va='bottom', fontfamily='serif')

    plt.tight_layout()
    plt.savefig('/home/peace/Keystone/docs/images/keystone_architecture.png',
                dpi=300, bbox_inches='tight', facecolor=COLORS['background'],
                edgecolor='none')
    plt.close()
    print("Created: keystone_architecture.png")


def create_governance_diagram():
    """
    Create the Federated Governance diagram with enhanced styling.
    """
    fig, ax = plt.subplots(1, 1, figsize=(14, 11))
    fig.patch.set_facecolor(COLORS['background'])
    ax.set_facecolor(COLORS['background'])

    ax.set_xlim(-7.5, 7.5)
    ax.set_ylim(-5.5, 6)
    ax.axis('off')

    # Title block
    ax.text(-7, 5.5, 'Federated Constitutional Governance',
            fontsize=22, fontweight='bold', fontstyle='italic',
            color=COLORS['text_dark'], ha='left', va='top',
            fontfamily='serif')
    ax.text(-7, 4.9, 'Five Co-Equal Sovereign Principles',
            fontsize=13, color=COLORS['text_medium'], ha='left', va='top',
            fontfamily='serif')
    ax.plot([-7, 7], [4.5, 4.5], color=COLORS['grid'], linewidth=0.5)

    # Pentagon layout for principles
    center = (0, 0.5)
    radius = 3.5
    # Pentagon angles (start from top, going clockwise)
    angles = [90, 162, 234, 306, 18]

    principles = [
        {
            'name': 'FIDUCIARY\nLOYALTY',
            'domain': 'Pilot-Agent\nRelationship',
            'subdivisions': 'Duty of Loyalty, Care, Disclosure',
            'color': GOV_COLORS['fiduciary'],
        },
        {
            'name': 'SYSTEMIC\nINTEGRITY',
            'domain': 'Computational\nEnvironment',
            'subdivisions': 'Least Privilege, State Preservation',
            'color': GOV_COLORS['systemic'],
        },
        {
            'name': 'SOCIAL\nCOVENANT',
            'domain': 'External World\nHuman Rights',
            'subdivisions': 'Compliance, Rights, Equity',
            'color': GOV_COLORS['social'],
        },
        {
            'name': 'EPISTEMIC\nVERACITY',
            'domain': 'Information\nQuality',
            'subdivisions': 'Truth, Uncertainty, Rationality',
            'color': GOV_COLORS['epistemic'],
        },
        {
            'name': 'PRESERVATION\nOF SAFETY',
            'domain': 'Physical\nHarm',
            'subdivisions': 'Non-Maleficence, Proportionality',
            'color': GOV_COLORS['safety'],
        },
    ]

    principle_positions = []

    # Draw principles as hexagonal nodes
    for i, (angle, principle) in enumerate(zip(angles, principles)):
        rad = np.radians(angle)
        x = center[0] + radius * np.cos(rad)
        y = center[1] + radius * np.sin(rad)
        principle_positions.append((x, y))

        # Principle node (larger, more prominent)
        node_radius = 0.85
        circle = plt.Circle((x, y), node_radius,
                           facecolor=principle['color'],
                           edgecolor='white',
                           linewidth=2,
                           alpha=0.95,
                           zorder=10)
        ax.add_patch(circle)

        # Principle name (centered in circle)
        ax.text(x, y + 0.15, principle['name'],
                fontsize=8, fontweight='bold', color='white',
                ha='center', va='center', fontfamily='sans-serif',
                linespacing=0.85, zorder=11)

        # Domain label (outside circle)
        domain_offset = 1.15
        dx = x - center[0]
        dy = y - center[1]
        norm = np.sqrt(dx**2 + dy**2)
        label_x = x + (dx/norm) * domain_offset
        label_y = y + (dy/norm) * domain_offset

        ax.text(label_x, label_y, principle['domain'],
                fontsize=7, color=COLORS['text_medium'],
                ha='center', va='center', fontfamily='sans-serif',
                linespacing=0.85, zorder=5)

        # Connection to center (dashed line)
        ax.plot([center[0], x], [center[1], y],
                color=principle['color'], linewidth=1.5,
                linestyle='--', alpha=0.4, zorder=1)

    # Central Adjudicator hub
    adj_radius = 1.1
    adj_circle = plt.Circle(center, adj_radius,
                           facecolor=GOV_COLORS['adjudicator'],
                           edgecolor='white',
                           linewidth=2.5,
                           alpha=0.95,
                           zorder=15)
    ax.add_patch(adj_circle)

    ax.text(center[0], center[1] + 0.35, 'PITH AND\nSUBSTANCE',
            fontsize=10, fontweight='bold', color='white',
            ha='center', va='center', fontfamily='sans-serif',
            linespacing=0.85, zorder=16)
    ax.text(center[0], center[1] - 0.35, 'ADJUDICATOR',
            fontsize=9, fontweight='bold', color='white',
            ha='center', va='center', fontfamily='sans-serif', zorder=16)

    # Agent Action input (left)
    action_x = -6
    action_y = 2.5

    action_box = FancyBboxPatch(
        (action_x - 0.9, action_y - 0.5), 1.8, 1,
        boxstyle="round,pad=0.02,rounding_size=0.12",
        facecolor=GOV_COLORS['action'],
        edgecolor='white',
        linewidth=1.5,
        alpha=0.95,
        zorder=10
    )
    ax.add_patch(action_box)

    ax.text(action_x, action_y + 0.1, 'AGENT',
            fontsize=10, fontweight='bold', color='white',
            ha='center', va='center', fontfamily='sans-serif', zorder=11)
    ax.text(action_x, action_y - 0.2, 'ACTION',
            fontsize=10, fontweight='bold', color='white',
            ha='center', va='center', fontfamily='sans-serif', zorder=11)

    # Arrow: Action -> Adjudicator
    ax.annotate('', xy=(center[0] - adj_radius - 0.1, center[1] + 0.5),
                xytext=(action_x + 1, action_y),
                arrowprops=dict(arrowstyle='->', color=GOV_COLORS['action'],
                               lw=2.5, mutation_scale=18,
                               connectionstyle='arc3,rad=0.15'),
                zorder=5)
    ax.text(-3.5, 2.8, '1. Route',
            fontsize=9, fontweight='bold', color=GOV_COLORS['adjudicator'],
            ha='center', va='center', fontfamily='sans-serif')

    # Classification dimensions box (below adjudicator)
    class_x = 0
    class_y = -2.2

    class_box = FancyBboxPatch(
        (class_x - 2, class_y - 0.8), 4, 1.6,
        boxstyle="round,pad=0.02,rounding_size=0.1",
        facecolor='white',
        edgecolor=GOV_COLORS['adjudicator'],
        linewidth=1.5,
        alpha=0.95,
        zorder=10
    )
    ax.add_patch(class_box)

    ax.text(class_x, class_y + 0.5, 'Classification Dimensions',
            fontsize=10, fontweight='bold', color=GOV_COLORS['adjudicator'],
            ha='center', va='center', fontfamily='sans-serif', zorder=11)

    dimensions = [
        ('Patient', 'Who/what is affected?'),
        ('Trust Boundary', 'Crosses boundary?'),
        ('Reversibility', 'Can be undone?'),
    ]
    for i, (dim, desc) in enumerate(dimensions):
        y_pos = class_y + 0.05 - i * 0.4
        ax.text(class_x - 1.7, y_pos, dim + ':',
                fontsize=8, fontweight='bold', color=COLORS['text_dark'],
                ha='left', va='center', fontfamily='sans-serif', zorder=11)
        ax.text(class_x + 0.3, y_pos, desc,
                fontsize=8, color=COLORS['text_medium'],
                ha='left', va='center', fontfamily='sans-serif', zorder=11)

    # Decision outcomes (right side)
    decision_x = 6

    outcomes = [
        ('CLEARED', GOV_COLORS['cleared'], 'Proceed with action'),
        ('BLOCKED', GOV_COLORS['blocked'], 'Action rejected'),
        ('ESCALATED', GOV_COLORS['escalated'], 'Requires pilot approval'),
    ]

    for i, (outcome, color, desc) in enumerate(outcomes):
        out_y = 2.5 - i * 1.4

        out_box = FancyBboxPatch(
            (decision_x - 1.1, out_y - 0.45), 2.2, 0.9,
            boxstyle="round,pad=0.02,rounding_size=0.1",
            facecolor=color,
            edgecolor='white',
            linewidth=1.5,
            alpha=0.95,
            zorder=10
        )
        ax.add_patch(out_box)

        ax.text(decision_x, out_y + 0.15, outcome,
                fontsize=10, fontweight='bold', color='white',
                ha='center', va='center', fontfamily='sans-serif', zorder=11)
        ax.text(decision_x, out_y - 0.15, desc,
                fontsize=7, color='white', alpha=0.9,
                ha='center', va='center', fontfamily='sans-serif', zorder=11)

    # Arrow: Adjudicator -> Decisions
    ax.annotate('', xy=(decision_x - 1.2, 1.2),
                xytext=(center[0] + adj_radius + 0.1, center[1] - 0.3),
                arrowprops=dict(arrowstyle='->', color=GOV_COLORS['adjudicator'],
                               lw=2.5, mutation_scale=18,
                               connectionstyle='arc3,rad=-0.15'),
                zorder=5)
    ax.text(3.5, 0.8, '2. Decide',
            fontsize=9, fontweight='bold', color=GOV_COLORS['adjudicator'],
            ha='center', va='center', fontfamily='sans-serif')

    # Conflict resolution protocol (bottom)
    conflict_y = -4.2
    conflict_box = FancyBboxPatch(
        (-3, conflict_y - 0.5), 6, 1,
        boxstyle="round,pad=0.02,rounding_size=0.1",
        facecolor='#f5f5f5',
        edgecolor=COLORS['accent'],
        linewidth=1,
        alpha=0.95,
        zorder=5
    )
    ax.add_patch(conflict_box)

    ax.text(0, conflict_y + 0.2, 'Conflict Resolution Protocol',
            fontsize=9, fontweight='bold', color=COLORS['accent'],
            ha='center', va='center', fontfamily='sans-serif', zorder=6)
    ax.text(0, conflict_y - 0.15, 'HARM > ORIGIN > ACTOR',
            fontsize=9, fontweight='bold', color=COLORS['text_dark'],
            ha='center', va='center', fontfamily='monospace', zorder=6)

    # Key insight
    ax.text(0, -5,
            '* Each principle governs its jurisdictional domain exclusively *',
            fontsize=10, fontstyle='italic', color=COLORS['accent'],
            ha='center', va='top', fontfamily='serif')

    # Legend for flow
    ax.text(-6.5, -0.5, 'Flow:', fontsize=8, fontweight='bold',
            color=COLORS['text_dark'], ha='left', va='center')
    ax.annotate('', xy=(-5, -0.5), xytext=(-5.8, -0.5),
                arrowprops=dict(arrowstyle='->', color=GOV_COLORS['adjudicator'],
                               lw=1.5, mutation_scale=12))
    ax.text(-4.8, -0.5, 'Action routing', fontsize=7,
            color=COLORS['text_medium'], ha='left', va='center')

    plt.tight_layout()
    plt.savefig('/home/peace/Keystone/docs/images/federated_governance.png',
                dpi=300, bbox_inches='tight', facecolor=COLORS['background'],
                edgecolor='none')
    plt.close()
    print("Created: federated_governance.png")


if __name__ == '__main__':
    print("Generating enhanced Keystone diagrams...")
    print()
    create_architecture_diagram()
    create_governance_diagram()
    print()
    print("Done! Images saved to /home/peace/Keystone/docs/images/")
